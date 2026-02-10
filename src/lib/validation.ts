export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    if (!password) {
        return { isValid: false, message: "Password is required" };
    }

    if (password.length < 6) {
        return { isValid: false, message: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Minimum 6 characters required)" };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase) {
        return { isValid: false, message: "कम से कम एक बड़ा अक्षर (Caps Lock) जरूरी है (At least one uppercase letter required)" };
    }

    if (!hasNumber) {
        return { isValid: false, message: "कम से कम एक अंक (Digit) जरूरी है (At least one digit required)" };
    }

    if (!hasSpecial) {
        return { isValid: false, message: "कम से कम एक विशेष चिन्ह (Special Character مثل @, #, $) जरूरी है (At least one special character required)" };
    }

    return { isValid: true, message: "Valid password" };
}
