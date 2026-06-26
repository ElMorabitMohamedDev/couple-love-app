import { motion } from "motion/react";
import { Cake, Heart, Sparkles } from "lucide-react";
import { formatReadableDate } from "../../utils/dates";
import type { UpcomingBirthday } from "../../lib/types";

function BirthdayAvatar({ person }: { person: UpcomingBirthday }) {
  if (person.photo) {
    return (
      <img
        src={person.photo}
        alt={person.name}
        className="h-12 w-12 rounded-full object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500 shadow-sm">
      <Cake className="h-5 w-5" />
    </div>
  );
}

export function UpcomingBirthdayList({
  birthdays,
  onOpenMemory,
  onWriteMessage,
}: {
  birthdays: UpcomingBirthday[];
  onOpenMemory: () => void;
  onWriteMessage: () => void;
}) {
  if (birthdays.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.18 }}
      className="rounded-3xl bg-white p-5 shadow-md"
    >
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
        <h2 className="text-sm text-gray-700">Gentle birthday reminders</h2>
      </div>

      <div className="space-y-3">
        {birthdays.map((birthday) => {
          const isToday = birthday.days_left === 0;
          const message = isToday
            ? `Today is ${birthday.name}'s birthday`
            : `${birthday.name}'s birthday is in ${birthday.days_left} day${birthday.days_left === 1 ? "" : "s"}`;

          return (
            <div
              key={`${birthday.type}-${birthday.id ?? birthday.name}`}
              className="rounded-2xl bg-rose-50/70 px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <BirthdayAvatar person={birthday} />
                  {isToday && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.4 }}
                      animate={{ scale: 1.15, opacity: 1 }}
                      transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.9 }}
                      className="absolute -right-1 -top-1 rounded-full bg-white p-1 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                    </motion.div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-800">
                    {isToday ? "Today is worth celebrating" : "A special day is close"}
                  </div>
                  <div className="mt-1 text-sm text-rose-700">{isToday ? `Today is ${birthday.name}'s birthday` : message}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatReadableDate(birthday.next_birthday_date)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onOpenMemory}
                  className="flex-1 rounded-2xl bg-white px-3 py-2 text-xs text-gray-700 shadow-sm"
                >
                  Open memory
                </button>
                <button
                  type="button"
                  onClick={onWriteMessage}
                  className="flex-1 rounded-2xl bg-rose-100 px-3 py-2 text-xs text-rose-600"
                >
                  Write a message
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
