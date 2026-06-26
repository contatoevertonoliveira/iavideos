import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarItem } from "../useCalendar";

type Props = {
  items: CalendarItem[];
  onRangeChange: (startISODate: string, endISODate: string) => void;
  onEventClick: (id: number) => void;
  onEventDrop: (id: number, dateISO: string) => void;
};

export default function CalendarGrid({ items, onRangeChange, onEventClick, onEventDrop }: Props) {
  const events = items.map((it) => ({
    id: String(it.id),
    title: it.title,
    start: it.scheduled_at ?? undefined,
    end: undefined,
    extendedProps: {
      platform: it.platform,
      status: it.status,
      account: it.social_account_id,
    },
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-[#16132B] text-white">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        selectable={true}
        editable={true}
        events={events}
        datesSet={(arg) => {
          const start = arg.startStr?.slice(0, 10) ?? new Date(arg.start).toISOString().slice(0, 10);
          const end = arg.endStr?.slice(0, 10) ?? new Date(arg.end).toISOString().slice(0, 10);
          onRangeChange(start, end);
        }}
        eventClick={(arg) => onEventClick(Number(arg.event.id))}
        eventDrop={(arg) => {
          const d = arg.event.start;
          if (!d) return;
          const iso = d.toISOString();
          onEventDrop(Number(arg.event.id), iso);
        }}
      />
    </div>
  );
}