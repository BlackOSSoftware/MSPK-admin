import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";
import TableHeaderCell from "../../components/ui/TableHeaderCell";

const TicketTable = ({ tickets, highlightTerm, isLoading, onStatusChange }) => {
  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading tickets...
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No tickets found
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Subject</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket._id}
              className="border-b border-white/5 hover:bg-white/5"
            >
              <td className="p-3 font-mono text-xs">{ticket.ticketId}</td>

              <td className="p-3">{ticket.subject}</td>

              <td className="p-3">
                <span
                  className={clsx(
                    "px-2 py-1 rounded text-xs font-bold",
                    ticket.status === "OPEN" && "bg-red-500/20 text-red-500",
                    ticket.status === "RESOLVED" &&
                      "bg-emerald-500/20 text-emerald-500",
                    ticket.status === "CLOSED" &&
                      "bg-gray-500/20 text-gray-400"
                  )}
                >
                  {ticket.status}
                </span>
              </td>

              <td className="p-3 text-xs">
                {ticket.user?.name || "Unknown"}
              </td>

              <td className="p-3 flex gap-2">
                <button
                  onClick={() =>
                    onStatusChange(ticket._id, "RESOLVED")
                  }
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30"
                >
                  <CheckCircle size={14} />
                  Approve
                </button>

                <button
                  onClick={() =>
                    onStatusChange(ticket._id, "CLOSED")
                  }
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;