import React from "react";
import {
  CheckCircle,
  AlertCircle,
  Hash,
  MessageSquare,
  User,
  Activity,
  Calendar,
  Settings,
} from "lucide-react";
import { clsx } from "clsx";
import TableHeaderCell from "../ui/TableHeaderCell";

const normalizeStatus = (status) => {
  const value = (status || "").toString().trim().toLowerCase();
  return value === "open" ? "pending" : value;
};

const isClosedLike = (status) =>
  ["resolved", "closed", "rejected"].includes(normalizeStatus(status));

const getStatusColor = (status) => {
  switch (normalizeStatus(status)) {
    case "pending":
      return "text-amber-500";
    case "resolved":
    case "closed":
      return "text-emerald-500";
    case "rejected":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
};

const TicketTable = ({
  tickets,
  highlightTerm,
  isLoading,
  onAction,
  actionLoadingId,
  onRowClick,
}) => {
  const handleActionClick = (event, ticket, action) => {
    event.preventDefault();
    event.stopPropagation();
    onAction?.(ticket, action);
  };

  return (
    <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
            <tr>
              <TableHeaderCell
                className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm"
                icon={Hash}
                label="Ticket ID"
              />
              <TableHeaderCell
                className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm"
                icon={MessageSquare}
                label="Subject"
              />
              <TableHeaderCell
                className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm"
                icon={MessageSquare}
                label="Description"
              />
              <TableHeaderCell
                className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm"
                icon={User}
                label="User"
              />
              <TableHeaderCell
                className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm"
                icon={Activity}
                label="Status"
                align="center"
              />
              <TableHeaderCell
                className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm"
                icon={Calendar}
                label="Date"
                align="center"
              />
              <TableHeaderCell
                className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm"
                icon={Settings}
                label="Actions"
                align="center"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
            {isLoading
              ? [...Array(10)].map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-5 py-3 border-r border-border">
                      <div className="h-4 w-20 bg-muted/50 rounded" />
                    </td>
                    <td className="px-5 py-3 border-r border-border">
                      <div className="flex flex-col gap-1">
                        <div className="h-4 w-48 bg-muted/50 rounded" />
                        <div className="h-3 w-16 bg-muted/50 rounded" />
                      </div>
                    </td>
                    <td className="px-5 py-3 border-r border-border">
                      <div className="h-4 w-56 bg-muted/50 rounded" />
                    </td>
                    <td className="px-5 py-3 border-r border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-muted/50 rounded-full" />
                        <div className="flex flex-col gap-1">
                          <div className="h-3 w-24 bg-muted/50 rounded" />
                          <div className="h-2 w-32 bg-muted/50 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 border-r border-border text-center">
                      <div className="h-5 w-20 bg-muted/50 rounded mx-auto" />
                    </td>
                    <td className="px-5 py-3 border-r border-border text-center">
                      <div className="h-4 w-24 bg-muted/50 rounded mx-auto" />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="h-6 w-6 bg-muted/50 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              : tickets.map((ticket, index) => {
                  const subject = ticket.subject || "-";
                  const description = ticket.description || "-";
                  const ticketType = ticket.ticketType || ticket.category || "-";
                  const contactEmail = ticket.contactEmail || ticket.user?.email || "";
                  const contactNumber = ticket.contactNumber || ticket.user?.phone || "";
                  const userName =
                    ticket.user?.name ||
                    ticket.contactName ||
                    contactEmail ||
                    contactNumber ||
                    "Unknown User";
                  const userInitials = userName.substring(0, 2).toUpperCase();
                  const sourceLabel =
                    ticket.source === "web_enquiry" ? "Web Enquiry" : "Support Ticket";
                  const dateStr = ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleDateString()
                    : "-";
                  const term = (highlightTerm || "").toLowerCase();
                  const isHighlighted =
                    term &&
                    [
                      ticket.ticketId,
                      subject,
                      description,
                      ticketType,
                      ticket.contactName,
                      sourceLabel,
                      userName,
                      contactEmail,
                      contactNumber,
                    ]
                      .filter(Boolean)
                      .some((value) => value.toLowerCase().includes(term));
                  const rowLocked = isClosedLike(ticket.status);
                  const isProcessing = actionLoadingId === ticket._id;
                  const displayStatus =
                    normalizeStatus(ticket.status) === "pending" ? "Open" : ticket.status;

                  return (
                    <tr
                      key={ticket._id || ticket.ticketId || index}
                      onClick={() => onRowClick?.(ticket)}
                      className={`transition-all duration-500 group relative cursor-pointer ${
                        isHighlighted
                          ? "!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20"
                          : "hover:bg-primary/[0.02]"
                      }`}
                    >
                      <td className="px-5 py-3 border-r border-border font-bold text-muted-foreground">
                        {ticket.ticketId || ticket._id?.substring(0, 8)}
                      </td>
                      <td className="px-5 py-3 border-r border-border">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-sans font-bold">{subject}</span>
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                            <span className="bg-secondary px-1 py-0.5 rounded">{ticketType}</span>
                            <span className="bg-primary/10 text-primary px-1 py-0.5 rounded border border-primary/15">
                              {sourceLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 border-r border-border text-muted-foreground">
                        <span className="block max-w-[420px] truncate">{description}</span>
                      </td>
                      <td className="px-5 py-3 border-r border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-[9px] font-bold border border-white/10 uppercase">
                            {userInitials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-foreground text-[10px] font-bold">{userName}</span>
                            {contactEmail ? (
                              <span className="text-[9px] text-muted-foreground">{contactEmail}</span>
                            ) : null}
                            {contactNumber ? (
                              <span className="text-[9px] text-muted-foreground">{contactNumber}</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center border-r border-border">
                        <div
                          className={clsx(
                            "flex items-center justify-center gap-1 font-bold uppercase tracking-wider text-[10px]",
                            getStatusColor(ticket.status),
                          )}
                        >
                          {normalizeStatus(ticket.status) === "pending" ? (
                            <AlertCircle size={10} />
                          ) : (
                            <CheckCircle size={10} />
                          )}
                          {displayStatus}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                        {dateStr}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {!rowLocked ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={(event) => handleActionClick(event, ticket, "resolve")}
                              onMouseDown={(event) => event.stopPropagation()}
                              className="px-2.5 py-1 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] uppercase font-bold tracking-wider hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? "Updating..." : "Resolve"}
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={(event) => handleActionClick(event, ticket, "reject")}
                              onMouseDown={(event) => event.stopPropagation()}
                              className="px-2.5 py-1 rounded border border-red-500/30 text-red-400 bg-red-500/10 text-[10px] uppercase font-bold tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketTable;
