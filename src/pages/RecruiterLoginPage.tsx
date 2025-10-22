import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Briefcase, Mail, Lock, ArrowLeft } from "lucide-react";

export function RecruiterLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError, data } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleData?.role === "recruiter") {
          navigate("/recruiter-dashboard");
        } else {
          setError("This account is not registered as a recruiter.");
          await supabase.auth.signOut();
          setLoading(false);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002B5C] via-[#003A6E] to-[#1E4C80]">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#A8B8CC] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="bg-[#003A6E] bg-opacity-50 backdrop-blur-lg border border-[#6A7B93] border-opacity-20 rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-[#1E4C80] p-4 rounded-full">
                <Briefcase className="text-[#FBC888]" size={40} />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Recruiter Login
              </h2>
              <p className="text-[#A8B8CC]">
                Access the recruiter dashboard to review resumes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#A8B8CC] mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6A7B93]"
                    size={20}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#1E4C80] border border-[#6A7B93] text-white rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:border-[#FBC888] transition-colors"
                    placeholder="recruiter@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#A8B8CC] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6A7B93]"
                    size={20}
                  />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#1E4C80] border border-[#6A7B93] text-white rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:border-[#FBC888] transition-colors"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FBC888] hover:bg-[#FBC888]/90 text-[#002B5C] font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In as Recruiter"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#A8B8CC] text-sm">
                Are you a worker?{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-[#FBC888] hover:underline font-medium"
                >
                  Go to Worker Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
