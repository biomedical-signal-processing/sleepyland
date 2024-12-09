import { loadData } from './plotting.js'; // Ensure this is correctly exported
import { loadPerformanceData } from './plotting.js'; // Ensure this is correctly exported

// Navigation state
let currentSlide = 0;
let totalSlides = 0;

// Initialize navigation buttons
export const initializeNavigation = (total) => {
    totalSlides = total;

    // Navigation for hypnogram_combined
    document.getElementById('prev').addEventListener('click', () => {
        navigateSlide(-1, 'hypnogram_combined');
    });
    document.getElementById('next').addEventListener('click', () => {
        navigateSlide(1, 'hypnogram_combined');
    });

    // Navigation for hypnodensity
    document.getElementById('prevHypno').addEventListener('click', () => {
        navigateSlide(-1, 'hypnodensity');
    });
    document.getElementById('nextHypno').addEventListener('click', () => {
        navigateSlide(1, 'hypnodensity');
    });

    // Navigation for performance data
    document.getElementById('prevPerformance').addEventListener('click', () => {
        navigatePerformanceSlide(-1);
    });
    document.getElementById('nextPerformance').addEventListener('click', () => {
        navigatePerformanceSlide(1);
    });
};

// Helper function for regular navigation
const navigateSlide = (direction, type) => {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    loadData(currentSlide, type);
};

// Helper function for performance data navigation
const navigatePerformanceSlide = (direction) => {
    if (direction === -1 && currentSlide === 0) {
        currentSlide = totalSlides - 1;
    } else if (direction === 1 && currentSlide === totalSlides - 1) {
        currentSlide = 0;
    } else {
        currentSlide += direction;
    }
    loadPerformanceData(currentSlide);
};
