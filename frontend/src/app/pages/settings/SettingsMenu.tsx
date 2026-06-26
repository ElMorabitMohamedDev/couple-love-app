import { ChevronRight, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

export interface SettingsMenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export interface SettingsMenuGroup {
  title: string;
  items: SettingsMenuItem[];
}

interface SettingsMenuProps {
  groups: SettingsMenuGroup[];
}

export function SettingsMenu({ groups }: SettingsMenuProps) {
  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <motion.div
          key={group.title}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: groupIndex * 0.08 }}
          className="space-y-3"
        >
          <h2 className="px-2 text-sm text-gray-500">{group.title}</h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            {group.items.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                    index !== group.items.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
