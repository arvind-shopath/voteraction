import { redirect } from 'next/navigation';

export default function ImportPage() {
    // Redirect to the new path
    redirect('/voters/data-import');
}
