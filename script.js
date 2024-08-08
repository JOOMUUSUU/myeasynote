document.addEventListener("DOMContentLoaded", () => {
  const noteInput = document.getElementById("note-input");
  const addNoteButton = document.getElementById("add-note");
  const searchInput = document.getElementById("search-input");
  const noteList = document.getElementById("note-list");
  const themeToggleButton = document.getElementById("theme-toggle");
  const body = document.body;

  let selectedEvent;

  // Load theme from local storage
  const loadTheme = () => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      body.classList.add("dark");
    }
  };

  // Save theme to local storage
  const saveTheme = (theme) => {
    localStorage.setItem("theme", theme);
  };

  // Toggle theme
  const toggleTheme = () => {
    const isDark = body.classList.toggle("dark");
    saveTheme(isDark ? "dark" : "light");
  };

  // Event listener for theme toggle
  themeToggleButton.addEventListener("click", toggleTheme);

  // Load initial theme
  loadTheme();

  // Load notes from local storage
  const loadNotes = () => {
    const notes = JSON.parse(localStorage.getItem("notes")) || [];
    return notes;
  };

  // Save notes to local storage
  const saveNotes = (notes) => {
    localStorage.setItem("notes", JSON.stringify(notes));
  };

  // Render notes
  const renderNotes = (notes) => {
    noteList.innerHTML = "";
    notes.forEach((note, index) => {
      const noteItem = document.createElement("li");
      noteItem.className = "note-item flex justify-between items-center border-b p-2 rounded-lg";
      noteItem.innerHTML = `
        <input type="checkbox" class="mr-2" ${note.done ? "checked" : ""}>
        <span contenteditable="false" class="note-text ${note.done ? "done" : ""}">${note.text}</span>
        <small class="text-gray-500">(${note.date})</small>
        <div>
          <button data-index="${index}" class="edit-note text-blue-500">Edit</button>
          <button data-index="${index}" class="delete-note text-red-500">Delete</button>
        </div>
      `;
      noteList.appendChild(noteItem);

      // Checkbox event listener
      const checkbox = noteItem.querySelector("input[type='checkbox']");
      checkbox.addEventListener("change", () => {
        note.done = checkbox.checked;
        saveNotes(notes);
        renderNotes(notes);
      });
    });
  };

  // Validate note text length
  const validateNoteLength = (noteText) => {
    if (noteText.length > 30) {
      alert("Note text must be 30 characters or less.");
      return false;
    }
    return true;
  };

  // Add a new note
  const addNote = () => {
    const noteText = noteInput.value.trim();
    if (noteText) {
      if (validateNoteLength(noteText)) {
        const now = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Bangkok",
        });
        const notes = loadNotes();
        notes.push({ text: noteText, date: now, done: false });
        saveNotes(notes);
        renderNotes(notes);
        noteInput.value = "";
      }
    }
  };

  // Delete a note
  const deleteNote = (index) => {
    const notes = loadNotes();
    notes.splice(index, 1);
    saveNotes(notes);
    renderNotes(notes);
  };

  // Edit a note
  const editNote = (index) => {
    const notes = loadNotes();
    const noteItem = noteList.querySelector(`li:nth-child(${index + 1})`);
    const noteTextSpan = noteItem.querySelector('.note-text');
    noteTextSpan.contentEditable = true;
    noteTextSpan.focus();

    noteTextSpan.addEventListener("blur", () => {
      if (validateNoteLength(noteTextSpan.textContent.trim())) {
        notes[index].text = noteTextSpan.textContent.trim();
        noteTextSpan.contentEditable = false;
        saveNotes(notes);
        renderNotes(notes);
      } else {
        alert("Note text must be 30 characters or less.");
        noteTextSpan.contentEditable = false;
        renderNotes(notes);
      }
    });
  };

  // Search notes
  const searchNotes = (query) => {
    const notes = loadNotes();
    const filteredNotes = notes.filter((note) =>
      note.text.toLowerCase().includes(query.toLowerCase())
    );
    renderNotes(filteredNotes);
  };

  // Event listeners
  addNoteButton.addEventListener("click", addNote);
  noteInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addNote();
    }
  });
  searchInput.addEventListener("input", (e) => {
    searchNotes(e.target.value);
  });
  noteList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-note")) {
      const index = e.target.getAttribute("data-index");
      deleteNote(index);
    } else if (e.target.classList.contains("edit-note")) {
      const index = e.target.getAttribute("data-index");
      editNote(index);
    }
  });

  // Initial render
  renderNotes(loadNotes());

  // Load events from local storage
  const loadEvents = () => {
    const events = JSON.parse(localStorage.getItem("events")) || [];
    return events;
  };

  // Save events to local storage
  const saveEvents = (events) => {
    localStorage.setItem("events", JSON.stringify(events));
  };

  // Render FullCalendar with events
  $('#calendar').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    },
    editable: true,
    droppable: true,
    selectable: true,
    selectHelper: true,
    events: loadEvents(),
    eventRender: function(event, element) {
      if (moment().isAfter(event.start, 'day')) {
        element.css('text-decoration', 'line-through');
      }
      element.on('click', function() {
        selectedEvent = event;
        $('#eventModalLabel').text(event.title);
        $('#eventTitle').text(`Title: ${event.title}`);
        $('#eventTime').text(`Time: ${event.start.format('MMMM Do YYYY, h:mm:ss a')}`);
        $('#eventModal').modal('show');
      });
    },
    select: function(start, end) {
      var title = prompt('Event Title:');
      if (title) {
        var eventData = {
          id: String(Date.now()), // Assign a unique id
          title: title,
          start: start,
          end: end
        };
        $('#calendar').fullCalendar('renderEvent', eventData, true); // stick? = true
        const events = loadEvents();
        events.push(eventData);
        saveEvents(events);
      }
      $('#calendar').fullCalendar('unselect');
    },
    eventDrop: function(event) {
      const events = loadEvents();
      const eventIndex = events.findIndex(e => e.id === event.id);
      if (eventIndex > -1) {
        events[eventIndex].start = event.start.format();
        events[eventIndex].end = event.end ? event.end.format() : null;
        saveEvents(events);
      }
    },
    eventResize: function(event) {
      const events = loadEvents();
      const eventIndex = events.findIndex(e => e.id === event.id);
      if (eventIndex > -1) {
        events[eventIndex].start = event.start.format();
        events[eventIndex].end = event.end ? event.end.format() : null;
        saveEvents(events);
      }
    }
  });

  // Delete the selected event
  const deleteEvent = () => {
    if (selectedEvent) {
      $('#calendar').fullCalendar('removeEvents', selectedEvent.id);
      const events = loadEvents().filter(event => event.id !== selectedEvent.id);
      saveEvents(events);
      $('#eventModal').modal('hide');
    }
  };

  // Cross out past events on initial load
  const crossOutPastEvents = () => {
    const events = loadEvents();
    events.forEach(event => {
      if (moment().isAfter(event.start, 'day')) {
        event.className = 'crossed';
      }
    });
    saveEvents(events);
    $('#calendar').fullCalendar('rerenderEvents');
  };

  document.getElementById('deleteEvent').addEventListener('click', deleteEvent);

  crossOutPastEvents();
});
