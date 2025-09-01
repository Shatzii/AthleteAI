const express = require('express');
const router = express.Router();
const { validateNCAACalculation, sanitizeInput } = require('../middleware/validation');

// NCAA Eligibility Requirements Data
const ncaaRequirements = {
  division1: {
    name: 'Division I',
    gpaRequirements: {
      // Sliding scale: higher test scores allow lower GPA
      'super': { minGPA: 3.55, sat: 1280, act: 27 }, // Super qualifier
      'qualifier': { minGPA: 3.3, sat: 1100, act: 24 }, // Qualifier
      'partial': { minGPA: 2.3, sat: 980, act: 21 } // Partial qualifier
    },
    coreCourses: {
      english: 4,
      math: 3,
      naturalScience: 2,
      socialScience: 2,
      additionalEnglish: 1,
      additionalMath: 1,
      additionalScience: 1
    },
    totalCoreCourses: 16
  },
  division2: {
    name: 'Division II',
    gpaRequirements: {
      'qualifier': { minGPA: 2.2, sat: 820, act: 17 },
      'partial': { minGPA: 2.0, sat: 720, act: 15 }
    },
    coreCourses: {
      english: 3,
      math: 2,
      naturalScience: 2,
      socialScience: 2,
      additional: 2
    },
    totalCoreCourses: 14
  },
  division3: {
    name: 'Division III',
    gpaRequirements: {
      'qualifier': { minGPA: 0, sat: 0, act: 0 } // No minimum requirements
    },
    coreCourses: {
      english: 4,
      math: 3,
      naturalScience: 2,
      socialScience: 2,
      additional: 3
    },
    totalCoreCourses: 16
  }
};

// International student considerations
const internationalRequirements = {
  englishProficiency: {
    toefl: 80,
    ielts: 6.5,
    duolingo: 105
  },
  visaRequirements: {
    f1: {
      i20: true,
      sevis: true,
      financialProof: true
    }
  }
};

// Calculate NCAA eligibility
router.post('/calculate', sanitizeInput, validateNCAACalculation, (req, res) => {
  try {
    const {
      division,
      gpa,
      testType, // 'sat', 'act', 'none'
      testScore,
      isInternational,
      englishProficiency, // for international students
      coreCourses,
      gradeLevel // 'freshman', 'sophomore', etc.
    } = req.body;

    const requirements = ncaaRequirements[division];
    if (!requirements) {
      return res.status(400).json({
        success: false,
        message: 'Invalid division specified'
      });
    }

    let eligibility = {
      division: requirements.name,
      overallEligibility: 'not_eligible',
      gpaEligibility: 'not_eligible',
      testEligibility: 'not_eligible',
      coreCoursesEligibility: 'not_eligible',
      internationalEligibility: isInternational ? 'not_eligible' : 'eligible',
      recommendations: [],
      nextSteps: []
    };

    // Check GPA and Test Score Eligibility (Sliding Scale)
    let requiredGPA = 0;
    let requiredTestScore = 0;

    if (testType === 'sat') {
      if (testScore >= 1280) {
        requiredGPA = requirements.gpaRequirements.super?.minGPA || requirements.gpaRequirements.qualifier.minGPA;
        eligibility.gpaEligibility = gpa >= requiredGPA ? 'super_qualifier' : 'partial_qualifier';
      } else if (testScore >= 1100) {
        requiredGPA = requirements.gpaRequirements.qualifier.minGPA;
        eligibility.gpaEligibility = gpa >= requiredGPA ? 'qualifier' : 'partial_qualifier';
      } else if (testScore >= 980) {
        requiredGPA = requirements.gpaRequirements.partial.minGPA;
        eligibility.gpaEligibility = gpa >= requiredGPA ? 'partial_qualifier' : 'not_eligible';
      } else {
        eligibility.gpaEligibility = 'not_eligible';
      }
    } else if (testType === 'act') {
      if (testScore >= 27) {
        requiredGPA = requirements.gpaRequirements.super?.minGPA || requirements.gpaRequirements.qualifier.minGPA;
        eligibility.gpaEligibility = gpa >= requiredGPA ? 'super_qualifier' : 'partial_qualifier';
      } else if (testScore >= 24) {
        requiredGPA = requirements.gpaRequirements.qualifier.minGPA;
        eligibility.gpaEligibility = gpa >= requiredGPA ? 'qualifier' : 'partial_qualifier';
      } else if (testScore >= 21) {
        requiredGPA = requirements.gpaRequirements.partial.minGPA;
        eligibility.gpaEligibility = gpa >= requiredGPA ? 'partial_qualifier' : 'not_eligible';
      } else {
        eligibility.gpaEligibility = 'not_eligible';
      }
    } else {
      // No test score - Division III or special cases
      if (division === 'division3') {
        eligibility.gpaEligibility = gpa >= 0 ? 'qualifier' : 'not_eligible';
      } else {
        eligibility.gpaEligibility = 'not_eligible';
        eligibility.recommendations.push('Consider taking SAT or ACT for better eligibility');
      }
    }

    // Check Core Courses
    const totalCoreCourses = Object.values(coreCourses || {}).reduce((sum, courses) => sum + courses, 0);
    eligibility.coreCoursesEligibility = totalCoreCourses >= requirements.totalCoreCourses ? 'eligible' : 'not_eligible';

    // Check International Requirements
    if (isInternational) {
      if (englishProficiency) {
        const { test, score } = englishProficiency;
        const requiredScore = internationalRequirements.englishProficiency[test.toLowerCase()];
        if (score >= requiredScore) {
          eligibility.internationalEligibility = 'eligible';
        } else {
          eligibility.recommendations.push(`Improve ${test} score to meet minimum requirement of ${requiredScore}`);
        }
      } else {
        eligibility.recommendations.push('Complete English proficiency test (TOEFL, IELTS, or Duolingo)');
      }
    }

    // Determine Overall Eligibility
    const allEligible = [
      eligibility.gpaEligibility !== 'not_eligible',
      eligibility.testEligibility !== 'not_eligible',
      eligibility.coreCoursesEligibility === 'eligible',
      eligibility.internationalEligibility === 'eligible'
    ].every(status => status);

    if (allEligible) {
      if (eligibility.gpaEligibility === 'super_qualifier') {
        eligibility.overallEligibility = 'super_qualifier';
      } else if (eligibility.gpaEligibility === 'qualifier') {
        eligibility.overallEligibility = 'qualifier';
      } else {
        eligibility.overallEligibility = 'partial_qualifier';
      }
    }

    // Generate Recommendations and Next Steps
    if (eligibility.overallEligibility === 'not_eligible') {
      if (eligibility.gpaEligibility === 'not_eligible') {
        eligibility.nextSteps.push('Focus on improving GPA through academic support');
        eligibility.nextSteps.push('Consider academic tutoring programs');
      }
      if (eligibility.coreCoursesEligibility === 'not_eligible') {
        const needed = requirements.totalCoreCourses - totalCoreCourses;
        eligibility.nextSteps.push(`Complete ${needed} more core courses`);
      }
      if (eligibility.internationalEligibility === 'not_eligible') {
        eligibility.nextSteps.push('Prepare for English proficiency exams');
        eligibility.nextSteps.push('Consult with international student advisor');
      }
    } else {
      eligibility.nextSteps.push('Register with NCAA Eligibility Center');
      eligibility.nextSteps.push('Begin amateurism certification process');
      eligibility.nextSteps.push('Research college programs and requirements');
    }

    // Progress tracking for StarPath
    eligibility.starPath = {
      academicProgress: calculateAcademicProgress(gpa, coreCourses, requirements),
      eligibilityStatus: eligibility.overallEligibility,
      gradeLevel: gradeLevel,
      timeline: generateTimeline(gradeLevel, eligibility.overallEligibility)
    };

    res.json({
      success: true,
      data: eligibility
    });

  } catch (error) {
    console.error('NCAA calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating NCAA eligibility',
      error: error.message
    });
  }
});

// Get NCAA requirements for a division
router.get('/requirements/:division', (req, res) => {
  try {
    const { division } = req.params;
    const requirements = ncaaRequirements[division];

    if (!requirements) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requirements',
      error: error.message
    });
  }
});

// Get all NCAA divisions and their requirements
router.get('/requirements', (req, res) => {
  res.json({
    success: true,
    data: ncaaRequirements
  });
});

// Helper function to calculate academic progress
function calculateAcademicProgress(gpa, coreCourses, requirements) {
  const gpaProgress = Math.min((gpa / 4.0) * 100, 100);
  const coursesProgress = Math.min(
    (Object.values(coreCourses || {}).reduce((sum, courses) => sum + courses, 0) / requirements.totalCoreCourses) * 100,
    100
  );

  return {
    overall: Math.round((gpaProgress + coursesProgress) / 2),
    gpa: Math.round(gpaProgress),
    courses: Math.round(coursesProgress)
  };
}

// Helper function to generate timeline
function generateTimeline(gradeLevel, eligibilityStatus) {
  const timelines = {
    freshman: {
      immediate: ['Complete core courses', 'Maintain GPA', 'Prepare for standardized tests'],
      shortTerm: ['Register with NCAA Eligibility Center', 'Research colleges'],
      longTerm: ['Apply to colleges', 'Complete amateurism certification']
    },
    sophomore: {
      immediate: ['Continue core courses', 'Take standardized tests', 'Improve GPA if needed'],
      shortTerm: ['Official visits', 'Scholarship offers'],
      longTerm: ['Final college decisions', 'Enrollment']
    },
    junior: {
      immediate: ['Final core courses', 'Standardized test retakes if needed'],
      shortTerm: ['College applications', 'Official visits'],
      longTerm: ['Commit to college', 'Prepare for transition']
    },
    senior: {
      immediate: ['Final applications', 'Make college decision'],
      shortTerm: ['Enrollment', 'Academic preparation'],
      longTerm: ['College success', 'Professional development']
    }
  };

  return timelines[gradeLevel] || timelines.freshman;
}

module.exports = router;
