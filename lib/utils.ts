import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculateSkillLevel(percentage: number): string {
    if (percentage >= 80) return "Literate"
    if (percentage >= 50) return "Semi-Literate"
    return "Illiterate"
}

export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export function storeAssessmentData(data: any): void {
    localStorage.setItem("assessmentData", JSON.stringify(data))
}

export function getAssessmentData(): any {
    const data = localStorage.getItem("assessmentData")
    return data ? JSON.parse(data) : null
}
