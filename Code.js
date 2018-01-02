calendar_name = 'TimeTrackingMcNeel';
sheetName = calendar_name+'2018';
work_hours = '20:00:00';
start_year = 2018;
start_month = 1;
usual_day_start_h = 9;
usual_day_start_m = 0;
usual_day_end_h = 14;
usual_day_end_m = 30;


/* Set finish time of todays work day to the current time */
function stillWork() {
  var Calendar = CalendarApp.getCalendarsByName(calendar_name);
  //var sheetName = calendar_name+'2018';

  todayStart = new Date();
  todayStart.setHours(0);
  todayStart.setMinutes(0);
  todayEnd = new Date();
  todayEnd.setHours(23);
  todayEnd.setMinutes(59);
  var events = Calendar[0].getEvents(todayStart , todayEnd);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  //var psheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Plans");

  if (events[0]) {
    event = events[events.length-1];
    event.setTime(event.getStartTime(), new Date());
  } else {
    end = new Date();
    end.setHours(20);
    end.setMinutes(30);
    Calendar[0].createEvent("", new Date(), end);
  }

  importEvents();
}

/* Set time when you arrived at work */
function setStartWork(e) {
  var Calendar = CalendarApp.getCalendarsByName(calendar_name);
  //var sheetName = calendar_name+'2018';

  todayStart = new Date();
  todayStart.setHours(0);
  todayStart.setMinutes(0);
  todayEnd = new Date();
  todayEnd.setHours(23);
  todayEnd.setMinutes(59);
  var events = Calendar[0].getEvents(todayStart , todayEnd);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  //var psheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Plans");

  if (events[0]) {
    event = events[events.length-1];
    start = new Date();
    start.setHours(e.parameter.hh);
    start.setMinutes(e.parameter.mm);

    event.setTime(start, new Date());
  } else {
    start = new Date();
    start.setHours(e.parameter.hh);
    start.setMinutes(e.parameter.mm);
    Calendar[0].createEvent(e.parameter.comment, start, new Date());
  }


  var app = UiApp.getActiveApplication();
  app.close();

  importEvents();
}

/* Import work days from calendar */
function importEvents() {
  function getWorkHoursCell(d) {
    //can be depended on date
    return "H1";
  }

  function fillWorkHoursCells(sheet) {
    sheet.getRange("H1").setValue(work_hours);
  }

  function getWeekNumber(d) {
    d = new Date(d);
    d.setHours(0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    var yearStart = new Date(d.getFullYear(),0,1);
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
    return weekNo;
  }

  function addSumLine(week_start, sheet) {
    sheet.getRange(lineN,4).setFormula("=SUM(D"+week_start+":D"+(lineN-1)+")");
    sheet.getRange(lineN,4).setNumberFormat('[h]:mm');
    lineN += 2;
  }

  function addEOWRemaining(week, sheet) {
    sheet.getRange(lineN-2, 8).setFormula("=E"+(lineN-3));
    sheet.getRange(lineN-1, 8).setFormula("=SUM("+getWorkHoursCell()+",H"+(lineN-2)+")");
    sheet.getRange(lineN-1,8).setNumberFormat('[h]:mm');
    runningWorkHours = sheet.getRange(lineN-1, 8);
    runningHoursCell = "H"+(lineN-1);
  }

  function generateHeader(sheet) {
    var line = new Array();
    line.push('Date');
    line.push('Begin');
    line.push('End');
    line.push('Period');
    line.push('Remaining');
    line.push('Project');
    line.push('Description');

    sheet.getRange('A1:G1').setValues(new Array(line));

    sheet.getRange('A:A').setNumberFormat('dd/MM/YYYY');
    sheet.getRange('B:D').setNumberFormat('HH:mm');
    sheet.getRange('E:E').setNumberFormat('[h]:mm');
  }

  function fillLine(eventStart, eventEnd, eventTitle, eventDescription, lineN, sheet) {
    line = new Array();
    line.push(eventStart);
    line.push(eventStart);
    line.push(eventEnd);

    sheet.getRange(lineN,1,1,7).clear();
    sheet.getRange(lineN,1,1,3).setValues([line]);

    nextHour = new Date();
    nextHour.setHours(nextHour.getHours() - 1);
    if (nextHour > eventEnd) {
      sheet.getRange(lineN,1,1,4).setBackgroundColor("lightgray");
    }
    sheet.getRange(lineN,4).setFormula("=C"+lineN+"-B"+lineN);

    if(!nextWeek){
    sheet.getRange(lineN,5).setFormula("="+getWorkHoursCell(eventStart)+
                                       "-SUM(D"+week_start+":D"+lineN+")");
    } else {
      sheet.getRange(lineN,5).setFormula("="+runningHoursCell+
                                       "-SUM(D"+week_start+":D"+lineN+")");
    }
    sheet.getRange(lineN,6).setValue(eventTitle);
    sheet.getRange(lineN,7).setValue(eventDescription);

  }

  var year = start_year;
  var month = start_month;
  var startDate = new Date(year, month-1, 1);
  var endDate = new Date();
  var runningWorkHours = 0;
  var runningHoursCell = "";
  var nextWeek = false;
  endDate.setDate(40);

  var Calendar = CalendarApp.getCalendarsByName(calendar_name);
  //var sheetName = calendar_name+'2018';

  var events = Calendar[0].getEvents(startDate , endDate);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  //var psheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Plans");

  if (events[0]) {
    sheet.clear();

    fillWorkHoursCells(sheet);
    //fillWorkHoursCells(psheet);

    var eventarray = new Array();
    generateHeader(sheet);
    //generateHeader(psheet);

    var i = 0;
    var w = getWeekNumber(events[0].getStartTime());
    var m = events[0].getStartTime().getMonth();
    var lineN = 2;

    var week_start = lineN;
    var week_start_event = 0;
    var month_start = lineN;
    for (i = 0; i < events.length; i++) {
      var newW = getWeekNumber(events[i].getStartTime());
      if (newW != w) {
        addSumLine(week_start, sheet);
        addEOWRemaining(week_start, sheet)
        w = newW;
        week_start = lineN;
        week_start_event = i;
        nextWeek = true;
      }

      if (events[i].getStartTime().getMonth() != m) {
        sheet.getRange(lineN-1,1,1,4).setBorder(false, false, true, false, false, false);
        sheet.getRange(lineN,7).setValue("MONTH");
        month_start = lineN;
        m = events[i].getStartTime().getMonth();
      }


      fillLine(events[i].getStartTime(), events[i].getEndTime(), events[i].getTitle(), events[i].getDescription(), lineN, sheet);
      lineN++;

    }
    addSumLine(week_start, sheet);

    lineN = 2;
    day = events[0].getStartTime().getDay();
    dayNum = 1;
    //Plans
    week_start = 2;
    for (i = week_start_event; i < events.length; i++) {
      if (events[i].getStartTime().getDate() != day) {
        day = events[i].getStartTime().getDate();
        dayNum++;
      }

      //fillLine(events[i].getStartTime(), events[i].getEndTime(), events[i].getTitle(), events[i].getDescription(), lineN, psheet);
      lineN++;

    }

    day_date = events[events.length-1].getStartTime();
    day_date.setDate(day_date.getDate() + 1);
    for (i = dayNum; i < 6; i++) {

      day_start = new Date(day_date);
      day_start.setHours(usual_day_start_h);
      day_start.setMinutes(usual_day_start_m);

      day_end = new Date(day_date);
      day_end.setHours(usual_day_end_h);
      day_end.setMinutes(usual_day_end_m);
      //fillLine(day_start, day_end, "", "",lineN, psheet);
      day_date.setDate(day_date.getDate() + 1);
      lineN++;
    }
    //addSumLine(2, psheet);
  } else {
    Browser.msgBox('nothing between ' + startDate + ' till ' + endDate);
  }

  var app = UiApp.getActiveApplication();
  app.close();
  return app;
}
