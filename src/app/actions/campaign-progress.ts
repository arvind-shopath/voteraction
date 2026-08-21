'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getCampaignProgressStats(assemblyId?: number) {
    const session = await auth();
    const user = session?.user as any;
    const targetAssemblyId = assemblyId || user?.assemblyId || 1;

    // 1. Organization & Booths
    const [booths, workers, totalVoters, assembly] = await Promise.all([
        prisma.booth.findMany({
            where: { assemblyId: targetAssemblyId },
            include: {
                workers: {
                    select: { id: true, name: true, type: true, mobile: true }
                }
            },
            orderBy: { number: 'asc' }
        }),
        prisma.worker.findMany({
            where: { assemblyId: targetAssemblyId, deletedAt: null },
            include: {
                booth: { select: { number: true, name: true } },
                householdVisits: { select: { id: true, status: true } },
                tasks: { select: { id: true, status: true } }
            }
        }),
        prisma.voter.count({ where: { assemblyId: targetAssemblyId } }),
        prisma.assembly.findUnique({
            where: { id: targetAssemblyId },
            select: { id: true, number: true, name: true, totalBooths: true, totalVoters: true }
        })
    ]);

    // 2. Households & Field Visits
    const [totalHouseholds, verifiedHouseholds, geocodedHouseholds, visitedHouseholds, revisitHouseholds] = await Promise.all([
        prisma.household.count({ where: { assemblyId: targetAssemblyId } }),
        prisma.household.count({ where: { assemblyId: targetAssemblyId, locationStatus: 'Field_Verified' } }),
        prisma.household.count({ where: { assemblyId: targetAssemblyId, locationStatus: 'Geocoded' } }),
        prisma.household.count({ where: { assemblyId: targetAssemblyId, visits: { some: {} } } }),
        prisma.household.count({ where: { assemblyId: targetAssemblyId, visits: { some: { status: 'Revisit_Required' } } } })
    ]);

    // 3. Events
    const events = await prisma.event.findMany({
        where: { assemblyId: targetAssemblyId },
        select: { id: true, status: true, expectedAttendance: true, actualAttendance: true }
    });

    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === 'Completed').length;
    const ongoingEvents = events.filter(e => e.status === 'Ongoing').length;
    const scheduledEvents = events.filter(e => e.status === 'Scheduled' || e.status === 'Upcoming').length;

    // 4. Tasks & Issues
    const [tasks, issues] = await Promise.all([
        prisma.task.findMany({
            where: { assemblyId: targetAssemblyId },
            select: { id: true, status: true }
        }),
        prisma.issue.findMany({
            where: { assemblyId: targetAssemblyId },
            select: { id: true, status: true, priority: true }
        })
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Resolved').length;

    const openIssues = issues.filter(i => i.status !== 'Resolved').length;
    const urgentIssues = issues.filter(i => i.status !== 'Resolved' && i.priority === 'Urgent').length;

    // 5. Calculate Weighted Explainable Readiness Score
    const mappedHouseholds = verifiedHouseholds + geocodedHouseholds;
    const householdMappingRate = totalHouseholds > 0 ? (mappedHouseholds / totalHouseholds) * 100 : 40;
    const fieldCoverageRate = totalHouseholds > 0 ? (visitedHouseholds / totalHouseholds) * 100 : 30;

    const assignedBoothsCount = booths.filter(b => b.workers.length > 0).length;
    const teamAssignmentRate = booths.length > 0 ? (assignedBoothsCount / booths.length) * 100 : 50;

    const eventExecutionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 70;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 80;

    // Weights: Field Coverage 30%, Team Assignment 20%, Household Mapping 20%, Events 15%, Tasks 15%
    const readinessScore = Math.min(100, Math.round(
        (fieldCoverageRate * 0.30) +
        (teamAssignmentRate * 0.20) +
        (householdMappingRate * 0.20) +
        (eventExecutionRate * 0.15) +
        (taskCompletionRate * 0.15)
    ));

    // 6. Booth-wise Drill-down
    const householdsByBooth = await prisma.household.groupBy({
        by: ['boothNumber'],
        where: { assemblyId: targetAssemblyId },
        _count: { id: true }
    });

    const visitsByBooth = await prisma.household.groupBy({
        by: ['boothNumber'],
        where: {
            assemblyId: targetAssemblyId,
            visits: { some: {} }
        },
        _count: { id: true }
    });

    const householdBoothMap = new Map(householdsByBooth.map(h => [h.boothNumber, h._count.id]));
    const visitBoothMap = new Map(visitsByBooth.map(v => [v.boothNumber, v._count.id]));

    const boothDrillDown = booths.map(b => {
        const hCount = householdBoothMap.get(b.number) || 0;
        const vCount = visitBoothMap.get(b.number) || 0;
        const visitPercent = hCount > 0 ? Math.round((vCount / hCount) * 100) : 0;
        const hasTeam = b.workers.length > 0;

        return {
            boothNumber: b.number,
            name: b.nameHi || b.name || `बूथ संख्या ${b.number}`,
            totalHouseholds: hCount,
            visitedHouseholds: vCount,
            visitPercent,
            workerCount: b.workers.length,
            workers: b.workers.map(w => ({ name: w.name, type: w.type, mobile: w.mobile })),
            hasTeam,
            status: visitPercent > 70 ? 'Good' : (visitPercent > 30 ? 'Average' : 'Needs_Attention')
        };
    });

    // 7. Worker-wise Progress
    const workerProgress = workers.map(w => {
        const totalVisits = w.householdVisits.length;
        const assignedTasks = w.tasks.length;
        const completedTasksCount = w.tasks.filter(t => t.status === 'Completed').length;

        return {
            id: w.id,
            name: w.name,
            mobile: w.mobile,
            type: w.type,
            boothNumber: w.booth?.number || null,
            totalVisits,
            assignedTasks,
            completedTasks: completedTasksCount
        };
    });

    return {
        assembly: {
            id: assembly?.id || targetAssemblyId,
            name: assembly?.name || 'विधानसभा',
            number: assembly?.number || 1
        },
        readinessScore: Math.max(15, readinessScore),
        pillars: {
            fieldCoverage: {
                rate: Math.round(fieldCoverageRate),
                visited: visitedHouseholds,
                total: totalHouseholds,
                revisit: revisitHouseholds,
                pending: Math.max(0, totalHouseholds - visitedHouseholds)
            },
            teamAssignment: {
                rate: Math.round(teamAssignmentRate),
                assignedBooths: assignedBoothsCount,
                totalBooths: booths.length,
                activeWorkers: workers.length
            },
            householdMapping: {
                rate: Math.round(householdMappingRate),
                total: totalHouseholds,
                verified: verifiedHouseholds,
                geocoded: geocodedHouseholds,
                unmapped: Math.max(0, totalHouseholds - (verifiedHouseholds + geocodedHouseholds))
            },
            eventExecution: {
                rate: Math.round(eventExecutionRate),
                total: totalEvents,
                completed: completedEvents,
                ongoing: ongoingEvents,
                scheduled: scheduledEvents
            },
            taskCompletion: {
                rate: Math.round(taskCompletionRate),
                total: totalTasks,
                completed: completedTasks,
                pending: Math.max(0, totalTasks - completedTasks)
            }
        },
        issues: {
            open: openIssues,
            urgent: urgentIssues
        },
        boothDrillDown,
        workerProgress
    };
}
