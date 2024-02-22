customjsReady("time-tracker-recorder a span span", function(e) {	
	gsap.registerPlugin(TextPlugin);
	var watchForChange = document.querySelector("time-tracker-recorder a");
	var watcherFunction = new MutationObserver(getClockData);
	watcherFunction.observe(watchForChange, { attributes: true, childList: true, subtree: true } );
	getClockData();
});

async function getClockData() {
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
		makeAddon(curPerc, errorCheck, barColour, barColour);
		return;
	}

	var curProjectHTML = curProject.innerHTML;

	if ( ( /\d{4}/.test(curProjectHTML)) === false ) errorCheck = "Project needs to have a project number.";
	if ( curProjectHTML == "Project" ) errorCheck = "Select a project."

	if ( errorCheck != false ) {
		makeAddon(curPerc, errorCheck, barColour, "#fff");
		return;
	}

	var curTrackProjNum = curProjectHTML.match(/\d{4}/);

	var apiKey = "MTAwNTYwMTUtZWNkNy00ZTU4LWFiMWQtYjZjM2U5MDdmOWU0";
	var urlUser = new URL('https://api.clockify.me/api/v1/user');

	var curUserInfo = await fetch(urlUser, {
			headers: {
				"X-Api-Key": apiKey
			}
		});

	var curUserData = await curUserInfo.json();

	var curWorkspce = curUserData.activeWorkspace;

	var projectRequest = new URL("https://api.clockify.me/api/v1/workspaces/" + curWorkspce + "/projects/");

	projectRequest.searchParams.set('name', curTrackProjNum);

	var curProjectInfo = await fetch(projectRequest, {
			headers: {
				"X-Api-Key": apiKey
			}
		});

	var curProjectData = await curProjectInfo.json();

	var curProjBudg = convertToHours(curProjectData[0].estimate.estimate);
	var curProjHours = convertToHours(curProjectData[0].duration);

	if ( curProjBudg > 0 ) {
		var ratio = curProjHours / curProjBudg;
		var msg = "", flag: "";
		if ( ratio >= 0.75 && ratio < 100 ) {
			msg = "This project has passed 75% of the allocated hours.";
			flag = "warning"
		} else if ( ratio >= 100 && ratio < 150 ) {
			msg = "This project has passed 100% of the allocated hours.";
			flag = "over"
		} else if ( ratio >= 200 ) {
			msg = "This project has doubled the allocated hours.";
			flag = "double"
		}
		if ( ratio >= 75 ) fetch("https://eoks8y6o64nzz36.m.pipedream.net", {
			method: "POST",
			body: JSON.stringify({
				"project": curTrackProjNum,
				"hours": curProjHours,
				"budget": curProjBudg,
				"ratio": ratio,
				"msg": msg,
				"flag": flag
			})
		});
	}

	

	curPerc = 0;
	percTxt = "0%";
	barColour = "#8bc34a";

	curPerc = calcPerc(curProjBudg, curProjHours);
	percTxt = calcTxt(curProjBudg, curProjHours);
	barColour = calcBar(curProjBudg, curProjHours);

	makeAddon(curPerc, percTxt, barColour, "#fff");  
	//
	function convertToHours(PTdata) {		
		var hours = 0, minutes = 0, seconds = 0;

		if ( (/(\d+)H/.test(PTdata)) == true ) hours = PTdata.match(/(\d+)H/)[1] * 1;
		if ((/(\d+)M/.test(PTdata)) == true ) minutes = ( PTdata.match(/(\d+)M/)[1] * 1) / 60;
		if ( (/(\d+)S/.test(PTdata)) == true ) seconds = ( PTdata.match(/(\d+)S/)[1] / 60 ) / 60;
		
		return Math.round(hours + minutes + seconds);
	}

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

function makeAddon(curPerc, percTxt, barColour, bgColour) {
	var newRow = document.getElementById("WeMOV_clock");
	var firstTime = false;
	if ( newRow == null ) {
		firstTime = true;
		newRow = document.createElement('div');
		newRow.id = "WeMOV_clock";

		newRow.style.width = "100%";
		newRow.style.height = "0rem";
		newRow.style.border = "1px solid #C6D2D9";
		newRow.style.borderRadius = "2px";
		newRow.style.display = "grid";
		newRow.style.overflow = "hidden";
	}	 

	var initBarWidth = "0%";
	var initColour = barColour;
	var initTxt = percTxt;

	var curBar = document.getElementById("WeMOV_clock-bar");
	var curText = document.getElementById("WeMOV_clock-text");

	if ( curBar != null ) {
		initBarWidth = curBar.style.width;
		initColour = curBar.style.backgroundColor;
		initTxt = curText.innerHTML;
	}

	var tempHtml = "";

	tempHtml = "<div style='background-color:" + bgColour + ";height:100%'>"
	tempHtml += "<div id='WeMOV_clock-bar' style='background-color:" + initColour + ";width:" + initBarWidth + "; height:100%'></div></div>";
	tempHtml += "<div id='WeMOV_clock-text' style='opacity:"+ (firstTime ? "0" : "1") +"; position: absolute; padding:" + (firstTime ? "0rem" : "0.1rem") + "0.1rem 0px;text-align: center; width:100%; color: #000'>" + initTxt + "</div>";

	newRow.innerHTML = tempHtml;

	if ( firstTime ) {
		var targDiv = document.querySelector("time-tracker-recorder");
		targDiv.appendChild(newRow);

		gsap.to("#WeMOV_clock", {height: "2rem", duration: 1, ease: "power2.out"} )
	}

	var t2 = gsap.timeline();
		t2.to("#WeMOV_clock-text", {opacity: "0", duration: 0.5, ease: "power1.in"})
		.to("#WeMOV_clock-text", {text: percTxt, duration: 0, ease: "none"})
		.to("#WeMOV_clock-text", {opacity: "1", duration: 0.5, ease: "power1.out"})

	gsap.to("#WeMOV_clock-bar", {backgroundColor: barColour, duration: 1, ease: "power1.out"});
	if ( curPerc == 0 || curPerc == 100 ) {
		gsap.to("#WeMOV_clock-bar", {width: curPerc + "%", duration: 1.5, ease: "bounce.out"});
	} else {
		gsap.to("#WeMOV_clock-bar", {width: curPerc + "%", duration: 2, ease: "power1.out"});
	}
}
