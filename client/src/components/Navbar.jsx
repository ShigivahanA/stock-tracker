import React from "react";
import { NavLink } from "react-router-dom";
import { Home, PlusCircle, Clock, BarChart2 } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/add", label: "Add", icon: PlusCircle },
  { to: "/history", label: "History", icon: Clock },
  { to: "/analytics", label: "Stats", icon: BarChart2 },
];

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex justify-around py-2">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
