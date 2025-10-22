import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { LogOut, Eye, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TradeCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Resume {
  id: string;
  user_id: string;
  title: string;
  resume_name: string;
  personal_info: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  work_experience: any[];
  skills: any[];
  education: any[];
  approval_status: string;
  trade_category_id: string | null;
  created_at: string;
  user_profiles: {
    full_name: string;
  };
  trade_categories: {
    name: string;
  } | null;
}

interface EngagementData {
  tradeName: string;
  count: number;
  [key: string]: string | number;
}

export function RecruiterDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  useEffect(() => {
    checkRecruiterRole();
    loadDashboardData();
  }, [user]);

  const checkRecruiterRole = async () => {
    if (!user) {
      navigate("/recruiter-login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "recruiter") {
      navigate("/");
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);

    const [resumesResult, categoriesResult] = await Promise.all([
      supabase
        .from("resumes")
        .select(`
          id,
          user_id,
          title,
          resume_name,
          personal_info,
          work_experience,
          skills,
          education,
          approval_status,
          trade_category_id,
          created_at,
          user_profiles!inner(full_name),
          trade_categories(name)
        `)
        .order("created_at", { ascending: false }),
      supabase.from("trade_categories").select("*").order("name"),
    ]);

    if (resumesResult.data) {
      setResumes(resumesResult.data as any);
      calculateEngagementData(resumesResult.data as any, categoriesResult.data || []);
    }

    setLoading(false);
  };

  const calculateEngagementData = (resumesList: Resume[], categories: TradeCategory[]) => {
    const engagementMap = new Map<string, number>();

    resumesList.forEach((resume) => {
      const tradeName = resume.trade_categories?.name || "Unclassified";
      engagementMap.set(tradeName, (engagementMap.get(tradeName) || 0) + 1);
    });

    categories.forEach((category) => {
      if (!engagementMap.has(category.name)) {
        engagementMap.set(category.name, 0);
      }
    });

    const data = Array.from(engagementMap.entries())
      .map(([tradeName, count]) => ({ tradeName, count }))
      .sort((a, b) => b.count - a.count);

    setEngagementData(data);
  };

  const handleApproveResume = async (resumeId: string) => {
    const { error } = await supabase
      .from("resumes")
      .update({ approval_status: "approved" })
      .eq("id", resumeId);

    if (!error) {
      await supabase
        .from("resume_approvals")
        .upsert({
          resume_id: resumeId,
          recruiter_id: user?.id,
          status: "approved",
          reviewed_at: new Date().toISOString(),
        });

      loadDashboardData();
      setSelectedResume(null);
    }
  };

  const handleRejectResume = async (resumeId: string) => {
    const { error } = await supabase
      .from("resumes")
      .update({ approval_status: "rejected" })
      .eq("id", resumeId);

    if (!error) {
      await supabase
        .from("resume_approvals")
        .upsert({
          resume_id: resumeId,
          recruiter_id: user?.id,
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        });

      loadDashboardData();
      setSelectedResume(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/recruiter-login");
  };

  const filteredResumes = resumes.filter((resume) => {
    const matchesStatus =
      statusFilter === "all" || resume.approval_status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      resume.user_profiles?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      resume.personal_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.trade_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const COLORS = ["#002B5C", "#003A6E", "#1E4C80", "#FBC888", "#6A7B93", "#2A4F7A", "#A8B8CC", "#0E3A5F", "#1A5490", "#264D6F"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002B5C] via-[#003A6E] to-[#1E4C80] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002B5C] via-[#003A6E] to-[#1E4C80]">
      <nav className="bg-[#003A6E] bg-opacity-50 backdrop-blur-lg border-b border-[#6A7B93] border-opacity-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-[#6A7B93] hover:bg-[#6A7B93]/80 text-white px-4 py-2 rounded-lg transition-all duration-200"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="bg-[#003A6E] bg-opacity-50 backdrop-blur-lg border border-[#6A7B93] border-opacity-20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Trade Work Engagement Overview
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#002B5C] bg-opacity-30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  Resume Distribution by Trade
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData.filter(d => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) =>
                        `${entry.tradeName}: ${(entry.percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {engagementData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E4C80",
                        border: "1px solid #6A7B93",
                        borderRadius: "8px",
                        color: "#FFFFFF",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#002B5C] bg-opacity-30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  Resume Count by Trade Category
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#6A7B93" />
                    <XAxis
                      dataKey="tradeName"
                      stroke="#A8B8CC"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#A8B8CC" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E4C80",
                        border: "1px solid #6A7B93",
                        borderRadius: "8px",
                        color: "#FFFFFF",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#003A6E" name="Resumes">
                      {engagementData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.count === Math.max(...engagementData.map(d => d.count)) ? "#FBC888" : "#003A6E"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-[#003A6E] bg-opacity-50 backdrop-blur-lg border border-[#6A7B93] border-opacity-20 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Resume Management</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6A7B93]"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by name or trade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#1E4C80] border border-[#6A7B93] text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-[#FBC888] transition-colors w-full sm:w-64"
                  />
                </div>
                <div className="relative">
                  <Filter
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6A7B93]"
                    size={18}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#1E4C80] border border-[#6A7B93] text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-[#FBC888] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#6A7B93]">
                    <th className="text-left text-[#A8B8CC] font-medium py-3 px-4">
                      Worker Name
                    </th>
                    <th className="text-left text-[#A8B8CC] font-medium py-3 px-4">
                      Trade Category
                    </th>
                    <th className="text-left text-[#A8B8CC] font-medium py-3 px-4">
                      Submission Date
                    </th>
                    <th className="text-left text-[#A8B8CC] font-medium py-3 px-4">
                      Status
                    </th>
                    <th className="text-left text-[#A8B8CC] font-medium py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResumes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[#A8B8CC]">
                        No resumes found
                      </td>
                    </tr>
                  ) : (
                    filteredResumes.map((resume) => (
                      <tr
                        key={resume.id}
                        className="border-b border-[#6A7B93] border-opacity-30 hover:bg-[#1E4C80] hover:bg-opacity-30 transition-colors"
                      >
                        <td className="py-4 px-4 text-white">
                          {resume.user_profiles?.full_name ||
                            resume.personal_info?.name ||
                            "N/A"}
                        </td>
                        <td className="py-4 px-4 text-white">
                          {resume.trade_categories?.name || "Unclassified"}
                        </td>
                        <td className="py-4 px-4 text-white">
                          {new Date(resume.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              resume.approval_status === "approved"
                                ? "bg-green-500 bg-opacity-20 text-green-400"
                                : resume.approval_status === "rejected"
                                ? "bg-red-500 bg-opacity-20 text-red-400"
                                : "bg-yellow-500 bg-opacity-20 text-yellow-400"
                            }`}
                          >
                            {resume.approval_status.charAt(0).toUpperCase() +
                              resume.approval_status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedResume(resume)}
                              className="flex items-center gap-1 bg-[#1E4C80] hover:bg-[#2A5A90] text-white px-3 py-1 rounded-lg text-sm transition-colors"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            {resume.approval_status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApproveResume(resume.id)}
                                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                >
                                  <CheckCircle size={16} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectResume(resume.id)}
                                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#003A6E] rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Resume Details</h3>
              <button
                onClick={() => setSelectedResume(null)}
                className="text-[#A8B8CC] hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-[#002B5C] bg-opacity-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-[#FBC888] mb-4">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="text-[#A8B8CC] text-sm">Name</p>
                    <p className="font-medium">
                      {selectedResume.personal_info?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#A8B8CC] text-sm">Email</p>
                    <p className="font-medium">
                      {selectedResume.personal_info?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#A8B8CC] text-sm">Phone</p>
                    <p className="font-medium">
                      {selectedResume.personal_info?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#A8B8CC] text-sm">Location</p>
                    <p className="font-medium">
                      {selectedResume.personal_info?.location || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#002B5C] bg-opacity-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-[#FBC888] mb-4">
                  Work Experience
                </h4>
                {selectedResume.work_experience?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedResume.work_experience.map((exp: any, index: number) => (
                      <div key={index} className="text-white">
                        <p className="font-semibold">{exp.jobTitle || exp.job_title}</p>
                        <p className="text-[#A8B8CC]">{exp.companyName || exp.company_name}</p>
                        <p className="text-sm text-[#A8B8CC]">
                          {exp.startDate || exp.start_date} -{" "}
                          {exp.isCurrent || exp.is_current ? "Present" : exp.endDate || exp.end_date}
                        </p>
                        {exp.description && (
                          <p className="text-sm mt-2">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#A8B8CC]">No work experience listed</p>
                )}
              </div>

              <div className="bg-[#002B5C] bg-opacity-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-[#FBC888] mb-4">Skills</h4>
                {selectedResume.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.skills.map((skill: any, index: number) => (
                      <span
                        key={index}
                        className="bg-[#1E4C80] text-white px-3 py-1 rounded-full text-sm"
                      >
                        {typeof skill === "string" ? skill : skill.name || skill.skill_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#A8B8CC]">No skills listed</p>
                )}
              </div>

              <div className="flex gap-3">
                {selectedResume.approval_status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApproveResume(selectedResume.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      <CheckCircle size={20} />
                      Approve Resume
                    </button>
                    <button
                      onClick={() => handleRejectResume(selectedResume.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      <XCircle size={20} />
                      Reject Resume
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedResume(null)}
                  className="flex-1 bg-[#6A7B93] hover:bg-[#6A7B93]/80 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
