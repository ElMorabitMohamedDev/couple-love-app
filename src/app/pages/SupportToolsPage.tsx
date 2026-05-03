import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { HandHeart, Mail, Shield, Sparkles } from "lucide-react";
import { ReconciliationButton } from "../components/shared/ReconciliationButton";

export function SupportToolsPage() {
  const navigate = useNavigate();

  const tools = [
    {
      icon: Shield,
      title: "Safe Space",
      description: "Express feelings anonymously",
      path: "/anonymous-space",
      color: "from-indigo-100 to-purple-100",
      iconColor: "text-indigo-600",
    },
    {
      icon: HandHeart,
      title: "Our Promises",
      description: "Keep track of commitments",
      path: "/promises",
      color: "from-purple-100 to-pink-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Mail,
      title: "Message Capsules",
      description: "Write to your future selves",
      path: "/capsules",
      color: "from-blue-100 to-indigo-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-dvh p-6">
      <div className="mb-6 pt-4">
        <h1 className="mb-2 text-2xl text-gray-800">Relationship Tools</h1>
        <p className="text-sm text-gray-500">Features to help strengthen your connection</p>
      </div>

      <div className="space-y-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <ReconciliationButton />
        </motion.div>

        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.path}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              onClick={() => navigate(tool.path)}
              className={`flex w-full items-center gap-4 rounded-3xl bg-gradient-to-r ${tool.color} p-5 text-left shadow-md transition-transform active:scale-[0.98]`}
            >
              <div className="rounded-full bg-white p-3">
                <Icon className={`h-6 w-6 ${tool.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="text-gray-800">{tool.title}</div>
                <div className="text-sm text-gray-600">{tool.description}</div>
              </div>
            </motion.button>
          );
        })}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 rounded-3xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-6"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 flex-shrink-0 text-amber-600" />
            <div className="space-y-2">
              <h3 className="text-gray-800">Why These Tools?</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Every relationship faces challenges. These tools are designed to help you communicate better, resolve conflicts gently, and keep your connection strong.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
