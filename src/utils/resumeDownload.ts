import jsPDF from "jspdf";

interface PersonalInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
}

interface WorkExperience {
  jobTitle: string;
  companyName: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

interface Education {
  institutionName: string;
  degreeOrProgram: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

interface Resume {
  id: string;
  title: string;
  personal_info: PersonalInfo;
  work_experience: WorkExperience[];
  skills: string[];
  education: Education[];
  certifications?: string[];
  resume_data?: {
    certifications?: string[];
  };
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "Present";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

export const downloadAsHTML = (resume: Resume) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resume.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #1a1a1a;
        }
        h2 {
            font-size: 1.5em;
            margin-top: 30px;
            margin-bottom: 15px;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }
        .contact-info {
            margin-bottom: 30px;
            color: #666;
        }
        .contact-info span {
            margin-right: 20px;
        }
        .experience-item, .education-item {
            margin-bottom: 20px;
            padding-left: 15px;
            border-left: 3px solid #2563eb;
        }
        .job-title, .degree {
            font-size: 1.2em;
            font-weight: bold;
            color: #1a1a1a;
        }
        .company, .institution {
            font-weight: 600;
            color: #444;
        }
        .date-range {
            color: #666;
            font-size: 0.9em;
        }
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .skill-tag {
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>${resume.personal_info.name}</h1>
    <div class="contact-info">
        ${
          resume.personal_info.email
            ? `<span>📧 ${resume.personal_info.email}</span>`
            : ""
        }
        ${
          resume.personal_info.phone
            ? `<span>📞 ${resume.personal_info.phone}</span>`
            : ""
        }
        ${
          resume.personal_info.location
            ? `<span>📍 ${resume.personal_info.location}</span>`
            : ""
        }
    </div>

    ${
      resume.work_experience && resume.work_experience.length > 0
        ? `
    <h2>Work Experience</h2>
    ${resume.work_experience
      .map(
        (exp) => `
        <div class="experience-item">
            <div class="job-title">${exp.jobTitle}</div>
            <div class="company">${exp.companyName}</div>
            <div class="date-range">
                ${exp.location ? `${exp.location} | ` : ""}
                ${formatDate(exp.startDate)} - ${
          exp.isCurrent ? "Present" : formatDate(exp.endDate)
        }
            </div>
            ${exp.description ? `<p>${exp.description}</p>` : ""}
        </div>
    `
      )
      .join("")}
    `
        : ""
    }

    ${
      resume.skills && resume.skills.length > 0
        ? `
    <h2>Skills</h2>
    <div class="skills">
        ${resume.skills
          .map((skill) => `<span class="skill-tag">${skill}</span>`)
          .join("")}
    </div>
    `
        : ""
    }

    ${
      resume.education && resume.education.length > 0
        ? `
    <h2>Education</h2>
    ${resume.education
      .map(
        (edu) => `
        <div class="education-item">
            <div class="degree">${edu.degreeOrProgram}</div>
            <div class="institution">${edu.institutionName}</div>
            ${edu.fieldOfStudy ? `<div>${edu.fieldOfStudy}</div>` : ""}
            ${
              edu.startDate || edu.endDate
                ? `
                <div class="date-range">
                    ${formatDate(edu.startDate)} - ${
                    edu.isCurrent ? "Present" : formatDate(edu.endDate)
                  }
                </div>
            `
                : ""
            }
        </div>
    `
      )
      .join("")}
    `
        : ""
    }

    ${(() => {
      const certifications =
        resume.certifications || resume.resume_data?.certifications || [];
      if (certifications.length > 0) {
        return `
            <h2>Certifications & Licenses</h2>
            ${certifications
              .map(
                (cert) => `
                <div class="education-item">
                    <div class="degree">${cert}</div>
                </div>
            `
              )
              .join("")}
            `;
      }
      return "";
    })()}
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${resume.title.replace(/\s+/g, "_")}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAsPDF = async (resume: Resume) => {
  try {
    // Initialize PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 15;
    let yPos = margin;

    // Helper function to check and add new page if needed
    const checkAndAddPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header - Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(resume.personal_info.name, margin, yPos + 20);
    yPos += 40;

    // Contact Information
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const contactInfo = [];
    if (resume.personal_info.email)
      contactInfo.push(`Email: ${resume.personal_info.email}`);
    if (resume.personal_info.phone)
      contactInfo.push(`Phone: ${resume.personal_info.phone}`);
    if (resume.personal_info.location)
      contactInfo.push(`Location: ${resume.personal_info.location}`);

    doc.text(contactInfo, margin, yPos);
    yPos += lineHeight * (contactInfo.length + 1);

    // Work Experience
    if (resume.work_experience && resume.work_experience.length > 0) {
      checkAndAddPage(100);
      yPos += 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Work Experience", margin, yPos);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
      yPos += 30;

      for (const exp of resume.work_experience) {
        checkAndAddPage(120);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(exp.jobTitle, margin + 15, yPos);
        yPos += lineHeight;

        doc.setFont("helvetica", "normal");
        doc.text(exp.companyName, margin + 15, yPos);
        yPos += lineHeight;

        doc.setTextColor(100, 100, 100);
        const dateText = `${formatDate(exp.startDate)} - ${
          exp.isCurrent ? "Present" : formatDate(exp.endDate)
        }`;
        if (exp.location) {
          doc.text(`${exp.location} | ${dateText}`, margin + 15, yPos);
        } else {
          doc.text(dateText, margin + 15, yPos);
        }
        yPos += lineHeight;

        if (exp.description) {
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(
            exp.description,
            pageWidth - margin * 3
          );
          checkAndAddPage(lines.length * lineHeight);
          doc.text(lines, margin + 15, yPos);
          yPos += lines.length * lineHeight;
        }

        yPos += 15;
      }
    }

    // Skills
    if (resume.skills && resume.skills.length > 0) {
      checkAndAddPage(100);
      yPos += 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Skills", margin, yPos);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
      yPos += 30;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const skillsText = resume.skills.join(" • ");
      const lines = doc.splitTextToSize(skillsText, pageWidth - margin * 2);
      doc.text(lines, margin + 15, yPos);
      yPos += lines.length * lineHeight + 15;
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      checkAndAddPage(100);
      yPos += 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Education", margin, yPos);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
      yPos += 30;

      for (const edu of resume.education) {
        checkAndAddPage(90);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(edu.degreeOrProgram, margin + 15, yPos);
        yPos += lineHeight;

        doc.setFont("helvetica", "normal");
        doc.text(edu.institutionName, margin + 15, yPos);
        yPos += lineHeight;

        if (edu.fieldOfStudy) {
          doc.text(edu.fieldOfStudy, margin + 15, yPos);
          yPos += lineHeight;
        }

        doc.setTextColor(100, 100, 100);
        const dateText = `${formatDate(edu.startDate)} - ${
          edu.isCurrent ? "Present" : formatDate(edu.endDate)
        }`;
        doc.text(dateText, margin + 15, yPos);
        yPos += lineHeight * 1.5;
      }
    }

    // Certifications
    const certifications =
      resume.certifications || resume.resume_data?.certifications || [];
    if (certifications.length > 0) {
      checkAndAddPage(100);
      yPos += 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Certifications & Licenses", margin, yPos);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
      yPos += 30;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      for (const cert of certifications) {
        checkAndAddPage(lineHeight * 2);
        doc.text(`• ${cert}`, margin + 15, yPos);
        yPos += lineHeight * 1.5;
      }
    }

    // Save the PDF
    doc.save(`${resume.title.replace(/\s+/g, "_")}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
};
