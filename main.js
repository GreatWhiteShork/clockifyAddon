var wemovTracker = {
	loaded: false,
	requestURL: null,
	apiKey: "MTAwNTYwMTUtZWNkNy00ZTU4LWFiMWQtYjZjM2U5MDdmOWU0"
};

var gsapScript = document.createElement("script");
	gsapScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
	gsapScript.async = true;
	document.getElementsByTagName("head")[0].appendChild(gsapScript);

var gsapTextScript = document.createElement("script");
	gsapTextScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/TextPlugin.min.js";
	gsapTextScript.async = true;
	document.getElementsByTagName("head")[0].appendChild(gsapTextScript);

customjsReady("time-tracker-recorder a span span", function(e) {
	gsap.registerPlugin(TextPlugin);
	var watchForChange = document.querySelector("time-tracker-recorder a");
	var watcherFunction = new MutationObserver(getClockData);
	watcherFunction.observe(watchForChange, { attributes: true, childList: true, subtree: true } );
	getClockData();
});

async function getClockData() {

	if ( wemovTracker.loaded ) {
		wemov_checkHours(wemovTracker.requestURL, wemovTracker.apiKey);
		wemovTracker.loaded = false;
		wemovTracker.requestURL = null;
	}

	var errorCheck = false;

	var curPerc = 0;
	var percTxt = "0%";
	var barColour = "#E4EAEE";
	var curProject;

	var isProjectTxt = document.querySelector("time-tracker-recorder a span");

	if ( isProjectTxt.innerHTML == "Project" ) {
		errorCheck = "Select a project.";
	} else {
		curProject = document.querySelector("time-tracker-recorder a span span");
		if ( curProject == null ) errorCheck = "Project not found."
	}

	if ( errorCheck != false ) {
		wemov_makeAddon(curPerc, errorCheck, barColour, barColour, null);
		return;
	}

	var curProjectHTML = curProject.innerHTML;

	if ( ( /\d{4}/.test(curProjectHTML)) === false ) errorCheck = "Project needs to have a project number.";
	if ( curProjectHTML == "Project" ) errorCheck = "Select a project."

	if ( errorCheck != false ) {
		wemov_makeAddon(curPerc, errorCheck, barColour, "#fff", null);
		return;
	}

	var curTrackProjNum = curProjectHTML.match(/\d{4}/);

	var urlUser = new URL('https://api.clockify.me/api/v1/user');

	var curUserInfo = await fetch(urlUser, {
			headers: {
				"X-Api-Key": wemovTracker.apiKey
			}
		});

	var curUserData = await curUserInfo.json();

	var curWorkspce = curUserData.activeWorkspace;

	var projectRequest = new URL("https://api.clockify.me/api/v1/workspaces/" + curWorkspce + "/projects/");

	projectRequest.searchParams.set('name', curTrackProjNum);
	projectRequest.searchParams.set('hydrated', 'true');

	var curProjectInfo = await fetch(projectRequest, {
			headers: {
				"X-Api-Key": wemovTracker.apiKey
			}
		});

	var curProjectData = await curProjectInfo.json();
	var curProjBudg = wemov_convertToHours(curProjectData[0].estimate.estimate);
	var curProjHours = wemov_convertToHours(curProjectData[0].duration);

	wemovTracker.loaded = true;
	wemovTracker.requestURL = projectRequest;

	//wemov_checkHours(projectRequest);

	curPerc = 0;
	percTxt = "0%";
	barColour = "#8bc34a";

	curPerc = calcPerc(curProjBudg, curProjHours);
	percTxt = calcTxt(curProjBudg, curProjHours);
	barColour = calcBar(curProjBudg, curProjHours);
	//console.log(curProjectData[0].tasks)
	wemov_makeAddon(curPerc, percTxt, barColour, "#fff", curProjectData[0]);  
	//

	function calcPerc(budget, tracked) {
		if ( budget <= 0 ) return 0;

		var perc = tracked / budget * 100;
		if ( perc > 100 ) perc = 100;
		return perc;
	}

	function calcTxt(budget, tracked) {
		if ( budget <= 0 ) return tracked + " hours tracked. (No hours allocated)";

		var rem = budget - tracked;

		if ( rem > 0 ) return tracked + " hours tracked. " + rem + " hours remaining. (" + tracked + "/" + budget +")";
		if ( rem == 0 ) return tracked + " hours tracked. All hours used up. (" + tracked + "/" + budget +")";
		if ( rem < 0 ) return tracked + " hours tracked. " + Math.abs(rem) + " hours over budget. (" + tracked + "/" + budget +")";
	}

	function calcBar(budget, tracked) {
		if ( budget == 0 ) return "#8bc34a";
		var perc = tracked / budget * 100;
		if ( perc < 75 ) return "#8bc34a";
		if ( perc >= 75 && perc < 90 ) return "#ffdd30";
		if ( perc >= 90 && perc < 100 ) return "#FF8601";
		return "#f44336";
	}
}

function wemov_makeAddon(curPerc, percTxt, barColour, bgColour, project) {
	var taskRow = document.getElementById("WeMOV_task");
	var overallRow = document.getElementById("WeMOV_overall");

	var firstTime = false;

	if ( taskRow == null ) {
		firstTime = true;
		taskRow = document.createElement('div');
		taskRow.id = "WeMOV_task";

		taskRow.style.width = "100%";
		taskRow.style.height = "0rem";
		taskRow.style.border = "1px solid #C6D2D9";
		taskRow.style.borderRadius = "2px";
		taskRow.style.display = "grid";
		taskRow.style.overflow = "hidden";

		taskRow.addEventListener("click", function() {
			var projectBreakdownText = document.getElementById("WeMOV_project-breakdown");
			if ( projectBreakdownText == null ) return;
			if ( projectBreakdownText.innerHTML == "" ) return;
			alert(projectBreakdownText.innerHTML);
		});



		overallRow = document.createElement('div');
		overallRow.id = "WeMOV_overall";

		overallRow.style.width = "100%";
		overallRow.style.height = "0rem";
		overallRow.style.border = "1px solid #C6D2D9";
		overallRow.style.borderRadius = "2px";
		overallRow.style.display = "grid";
		overallRow.style.overflow = "hidden";

		overallRow.addEventListener("click", function() {
			var projectBreakdownText = document.getElementById("WeMOV_project-breakdown");
			if ( projectBreakdownText == null ) return;
			if ( projectBreakdownText.innerHTML == "" ) return;
			alert(projectBreakdownText.innerHTML);
		});


	}	 

	var initBarWidth = "0%";
	var initColour = barColour;
	var initTxt = percTxt;

	var curBar = document.getElementById("WeMOV_task-bar");
	var curText = document.getElementById("WeMOV_task-text");

	if ( curBar != null ) {
		initBarWidth = curBar.style.width;
		initColour = curBar.style.backgroundColor;
		initTxt = curText.innerHTML;
	}

	var taskString = "";

	if ( project != null ) {

		taskString = project.name;
		taskString += "\r" + percTxt;

		for ( var task of project.tasks ) {
			var taskEstimate = 0;
			if ( task.estimate != null ) taskEstimate = wemov_convertToHours(task.estimate);
			var taskDuration = 0;
			if ( task.duration != null ) taskDuration = wemov_convertToHours(task.duration);

			if ( taskEstimate == 0 && taskDuration == 0 ) continue;

			taskString += "\r- (" + taskDuration + " / " + taskEstimate + " hours for " + task.name + ")";
		}
	}


	var taskHtml = "";

	taskHtml = "<div style='background-color:" + bgColour + ";height:100%'>"
	taskHtml += "<div id='WeMOV_task-bar' style='background-color:" + initColour + ";width:" + initBarWidth + "; height:100%'></div>";
	taskHtml += "</div>";
	taskHtml += "<div id='WeMOV_task-text' style='opacity:"+ (firstTime ? "0" : "1") +"; position: absolute; padding:" + (firstTime ? "0rem" : "0.1rem") + "0.1rem 0px;text-align: center; width:100%; color: #000'>" + initTxt + "</div>";
	if ( taskString != "" ) taskHtml += "<div id='WeMOV_project-breakdown' style='display:none'>" + taskString + "</div>";

	taskRow.innerHTML = taskHtml;

	var overallHtml = "";

	overallHtml = "<div style='background-color:" + bgColour + ";height:100%'>"
	overallHtml += "<div id='WeMOV_overall-bar' style='background-color:" + initColour + ";width:" + initBarWidth + "; height:100%'></div>";
	overallHtml += "</div>";
	overallHtml += "<div id='WeMOV_overall-text' style='opacity:"+ (firstTime ? "0" : "1") +"; position: absolute; padding:" + (firstTime ? "0rem" : "0.1rem") + "0.1rem 0px;text-align: center; width:100%; color: #000'>" + initTxt + "</div>";
	if ( taskString != "" ) overallHtml += "<div id='WeMOV_project-breakdown' style='display:none'>" + taskString + "</div>";

	overallRow.innerHTML = overallHtml;

	if ( firstTime ) {
		var targDiv = document.querySelector("time-tracker-recorder");
		targDiv.appendChild(taskRow);
		targDiv.appendChild(overallRow);

		gsap.to("#WeMOV_task", {height: "2rem", duration: 1, ease: "power2.out"} )
		gsap.to("#WeMOV_overall", {height: "1rem", duration: 1, ease: "power2.out"} )
	}

	var t2 = gsap.timeline();
		t2.to("#WeMOV_task-text", {opacity: "0", duration: 0.5, ease: "power1.in"})
		.to("#WeMOV_task-text", {text: percTxt, duration: 0, ease: "none"})
		.to("#WeMOV_task-text", {opacity: "1", duration: 0.5, ease: "power1.out"})

	var t3 = gsap.timeline();
		t3.to("#WeMOV_overall-text", {opacity: "0", duration: 0.5, ease: "power1.in"})
		.to("#WeMOV_overall-text", {text: percTxt, duration: 0, ease: "none"})
		.to("#WeMOV_overall-text", {opacity: "1", duration: 0.5, ease: "power1.out"})

	gsap.to("#WeMOV_task-bar", {backgroundColor: barColour, duration: 1, ease: "power1.out"});
	gsap.to("#WeMOV_overall-bar", {backgroundColor: barColour, duration: 1, ease: "power1.out"});

	if ( curPerc == 0 || curPerc == 100 ) {
		gsap.to("#WeMOV_task-bar", {width: curPerc + "%", duration: 1.5, ease: "bounce.out"});
		gsap.to("#WeMOV_overall-bar", {width: curPerc + "%", duration: 1.5, ease: "bounce.out"});
	} else {
		gsap.to("#WeMOV_task-bar", {width: curPerc + "%", duration: 2, ease: "power1.out"});
		gsap.to("#WeMOV_overall-bar", {width: curPerc + "%", duration: 2, ease: "power1.out"});
	}
}

async function wemov_checkHours(urlToCheck, apiKey) {
	//console.log("Checking hours through Clockify.")
	var curProjectInfo = await fetch(urlToCheck, {
			headers: {
				"X-Api-Key": apiKey
			}
		});

	var curProj = await curProjectInfo.json();
	var budg = wemov_convertToHours(curProj[0].estimate.estimate);
	var tracked = wemov_convertToHours(curProj[0].duration);
	var tasks = [];

	for ( var task of curProj[0].tasks ) {
		var taskEstimate = 0;
		if ( task.estimate != null ) taskEstimate = wemov_convertToHours(task.estimate);
		var taskDuration = 0;
		if ( task.duration != null ) taskDuration = wemov_convertToHours(task.duration);

		if ( taskEstimate == 0 && taskDuration == 0 ) continue;

		tasks.push({
			taskName: task.name,
			taskBudget: taskEstimate,
			taskHours: taskDuration
		})
	}


	if ( budg > 0 ) {
		var ratio = tracked / budg;
		var msg = "", flag = "";
		if ( ratio >= 0.75 && ratio < 1 ) {
			msg = ":warning:   A project has passed 75% of its allocated hours:";
			flag = "0"
		} else if ( ratio >= 1 && ratio < 2 ) {
			msg = ":rotating_light:  A project has exceeded 100% of its allocated hours  :rotating_light:";
			flag = "1"
		} else if ( ratio >= 2 ) {
			msg = ":fire::fire::fire:  A project has DOUBLED (at least!) its allocated hours  :fire::fire::fire:";
			flag = "2"
		}
		if ( ratio >= 0.75 ) {
			var newBody = {
					"project": curProj[0].name,
					"link": "https://app.clockify.me/projects/" + curProj[0].id + "/edit#status",
					"hours": tracked,
					"budget": budg,
					"tasks": tasks,
					"ratio": ratio,
					"msg": msg,
					"flag": flag
				};
			 fetch("https://eoks8y6o64nzz36.m.pipedream.net", {
				method: "POST",
				body: JSON.stringify(newBody)
			});
			 //console.log("Hours are looking shaky. Sending the following report to Pipedream.");
			 //console.log("We'll send a warning to Slack if this project has passed a new threshold.");
			 //console.log(newBody);
		}
	}
}

function wemov_convertToHours(PTdata) {		
	var hours = 0, minutes = 0, seconds = 0;

	if ( (/(\d+)H/.test(PTdata)) == true ) hours = PTdata.match(/(\d+)H/)[1] * 1;
	if ((/(\d+)M/.test(PTdata)) == true ) minutes = ( PTdata.match(/(\d+)M/)[1] * 1) / 60;
	if ( (/(\d+)S/.test(PTdata)) == true ) seconds = ( PTdata.match(/(\d+)S/)[1] / 60 ) / 60;
	
	return Math.round(hours + minutes + seconds);
}
