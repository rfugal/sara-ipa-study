/*global ipaStudy _config AmazonCognitoIdentity AWSCognito*/
window.learningRecord = {
	'UID': null,
	'email': null,
	'start': null,
	'finish': null,
	'interactions': [],
	'finished': false
}
window.learningContent = {
	'UID': null,
	'screen': null,
	'html': null,
	'title': null,
	'paragraphs': [],
	'phonemes': {}
};
var ipaPhonemesHttpRequest = new XMLHttpRequest();
ipaPhonemesHttpRequest.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
		window.ipaPhonemes = JSON.parse(this.responseText);
    }
}
ipaPhonemesHttpRequest.open("GET", "js/ipaPhonemes.json", true);
ipaPhonemesHttpRequest.send();

var ipaKnowledgeAssesment = {
	'email': null,
	'type': 'ipaKnowledge',
	'certain': {
		'correct': [],
		'incorrect': []
	},
	'uncertain': {
		'correct': [],
		'incorrect': []
	},
	'incorrectAnswers': {
		//  'a': {
		//  	'character': 'e',
		//  	'word': 'days'
		//  }
	}
}
var cycleScreen = [
	'#firstReadingAssesment',
	'#secondReadingAssesment',
	'#initialIpaKnowledge',
	'#firstIpaAssesment',
	'#secondIpaAssesment'
];
function updateLearningContent() {
	$.get('https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/content/', 
		  { 'email': window.learningRecord.email }, 
		  function(result) {
		if (typeof result.screen !== "undefined" && result.screen !== null) {
			window.learningContent.UID = result.UID;
			window.learningContent.screen = result.screen;
			window.learningContent.html = result.html;
			window.learningContent.title = result.title;
			window.learningContent.paragraphs = result.paragraphs;
			window.learningContent.phonemes = result.phonemes;
			sessionStorage.setItem('interactionIndex', result.studyMethod);
			$( window.learningContent.screen ).show();
			openLearningModal();
		} else {
			alert('Sorry, something went wrong when connecting with the server.');
			ipaStudy.signOut();
		}
	});
}
function updateLearnScreenDiv() {
	window.learningContent.screen = cycleScreen.shift();
	cycleScreen.push(window.learningContent.screen);
	$('div.mainReader').each(function(){
		$( this ).hide();
	}).ready(function(){
		// updateLearningContent();
		openLearningModal();
		$( window.learningContent.screen ).show();
	});
}
function putLearningRecord(learningRecord) {
	// $.put('https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/content/');
}
function putAssesment(assesment) {
	// $.put('https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/assesment/');
}
function assessInitialIpaKnowledge() {
	$('#modal_initialIpaKnowledge').modal('hide');
	$('#unsure_checkbox').prop('checked', false);
	var index = 
		ipaKnowledgeAssesment.certain.correct.length + 
		ipaKnowledgeAssesment.certain.incorrect.length +
		ipaKnowledgeAssesment.uncertain.correct.length + 
		ipaKnowledgeAssesment.uncertain.incorrect.length;
	if (index == 12) {
		window.loadLearn();
		return;
	}
	$('#initialIpaKnowledge_questionIndex').text('Question ' + (index + 1) + ' of 12');
	var testChar = window.ipaPhonemes.ipaQuiz[index];
	var options = window.ipaPhonemes.phonemes[testChar].quizOptions.slice(0, 5);
	options = window.shuffle(options).slice(0, 4);
	options.push(testChar);
	options = window.shuffle(options);
	$('#initialIpaKnowledge_body').html(testChar + ' sounds like &hellip;');
	$('#initialIpaKnowledge_options input').each(function() {
		var option = options.pop();
		var sound = window.ipaPhonemes.phonemes[option].sound;
		var word = window.shuffle( window.ipaPhonemes.phonemes[option].asIn )[0];
		var choice = [
			testChar,
			sound,
			word,
		].join(' ');
		$( this ).val(choice).attr('data-option', option).attr('data-correct', testChar).attr('data-word', word)
			.removeClass('btn-primary fadeInLeft fadeOutRight');
	});
	$('#initialIpaKnowledge_options input').off().addClass('disabled animated fadeInLeft');
	$('#modal_initialIpaKnowledge').modal('show');
	setTimeout(function(){ $('#initialIpaKnowledge_options input')
		.removeClass('disabled').off()
		.on('click', ipaMatchTest); }, 500);
}
function ipaMatchTest(){
	$('#initialIpaKnowledge_options input').off();
	$('#initialIpaKnowledge_options input').addClass('disabled');
	var option = $( this ).attr('data-option');
	var correct = $( this ).attr('data-correct');
	var word = $( this ).attr('data-word');
	if (option === correct) {
		$( this ).addClass('btn-primary');
		if ($('#unsure_checkbox').prop('checked')) {
			ipaKnowledgeAssesment.uncertain.correct.push(correct);
		} else {
			ipaKnowledgeAssesment.certain.correct.push(correct);
		}
	} else {
		$( this ).addClass('btn-primary');
		if ($('#unsure_checkbox').prop('checked')) {
			ipaKnowledgeAssesment.uncertain.incorrect.push(correct);
		} else {
			ipaKnowledgeAssesment.certain.incorrect.push(correct);
		}
	}
	setTimeout(function(){ $('#initialIpaKnowledge_options input').addClass('fadeOutRight'); }, 500);
	setTimeout(function(){ assessInitialIpaKnowledge(); }, 1500);
}
function openLearningModal() {
	window.learningRecord.finish = $.now();
	if (window.learningRecord.interactions.length > 0) {
		var learningRecord = $.extend({}, window.learningRecord);
		window.learningRecord.start = null;
		window.learningRecord.finish = null;
		window.learningRecord.interactions = [];
		putLearningRecord(learningRecord);
	}
	$('main div.modal').each(function() {
		$( this ).modal('hide');
	}).ready(function() {
		switch(window.learningContent.screen) {
			case '#firstReadingAssesment':
				$('#modal_firstReadingAssesment').modal('show');
				break;
			case '#secondReadingAssesment':
				$('#modal_secondReadingAssesment').modal('show');
				break;
			// case '#initialIpaKnowledge':
				// $('#modal_initialIpaKnowledge').modal('show');
				// This modal is opened from the home screen.
				// Hide the Pause Button instead.
			case '#learnImmersiveText':
				$('#modal_immersionInstructions').modal('show');
				break;
			case '#ipaReadingSpeed':
				$('#modal_ipaReadingSpeed').modal('show');
				break;
			case '#firstIpaAssesment':
				$('#modal_firstIpaAssesment').modal('show');
				break;
			case '#secondIpaAssesment':		
				$('#modal_secondIpaAssesment').modal('show');
				break;
		}		
	});

}
function loadAccount() {
	$('section').each(function() {
		$( this ).hide();
	}).ready(function(){
		$('#learn_screen').show();
		updateLearnScreenDiv();
		$('div.lowerRightButton div').on('click', function(){
			updateLearnScreenDiv();
		});
	});
}

//on first load
$(document).ready(function(){
	var cognitoUser = ipaStudy.userPool.getCurrentUser();
	if (cognitoUser === null) {
		window.location.replace('index.html');
	} else {
		cognitoUser.getSession(function(err, session) {
			if(!err) {
				if (session.isValid()) {
					cognitoUser.getUserAttributes(function(err, result) {
						if (!err) {
						}
						for (var i = 0; i < result.length; i++) {
							if (result[i].getName() === 'email'){
								var email = result[i].getValue();
								window.learningRecord.email = email;
								sessionStorage.setItem('email', email);
							}
						}
					});
					loadAccount();
				} else {
					ipaStudy.signOut();
				}
			} else {
				ipaStudy.signOut();
			}
		});
	}
	$(window).blur(function(){
		openLearningModal();
	});
});

var ipaStudy = window.ipaStudy || {};

var poolData = {
	UserPoolId: _config.cognito.userPoolId,
	ClientId: _config.cognito.userPoolClientId
};
if (!(_config.cognito.userPoolId &&
	  _config.cognito.userPoolClientId &&
	  _config.cognito.region)) {
	console.log('improper cognito config');
}
ipaStudy.userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
if (typeof AWSCognito !== 'undefined') {
	AWSCognito.config.region = _config.cognito.region;
}
ipaStudy.signOut = function signOut() {
	ipaStudy.userPool.getCurrentUser().signOut();
	window.location.replace('index.html');
};
ipaStudy.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
	var cognitoUser = ipaStudy.userPool.getCurrentUser();
	if (cognitoUser) {
		cognitoUser.getSession(function sessionCallback(err, session) {
			if (err) {
				reject(err);
			} else if (!session.isValid()) {
				resolve(null);
			} else {
				resolve(session.getIdToken().getJwtToken());
			}
		});
	} else {
		resolve(null);
	}
});
/*
* Cognito User Pool functions
*/
ipaStudy.register = function register(fname, email, password, onSuccess, onFailure) {
	var data_given_name = {
		Name: 'given_name',
		Value: fname
	};
	var attributeGivenName = new AmazonCognitoIdentity.CognitoUserAttribute(data_given_name);
	ipaStudy.userPool.signUp(email, password, [attributeGivenName], null,
					function signUpCallback(err, result) {
		if (!err) {
			onSuccess(result);
		} else {
			onFailure(err);
		}
	});
};
ipaStudy.signin = function signin(email, password, onSuccess, onFailure) {
	var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
		Username: email,
		Password: password
	});
	var cognitoUser = createCognitoUser(email);
	cognitoUser.authenticateUser(authenticationDetails, {
		onSuccess: onSuccess,
		onFailure: onFailure
	});
};
ipaStudy.verify = function verify(email, code, onSuccess, onFailure) {
	createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
		if (!err) {
			onSuccess(result);
		} else {
			onFailure(err);
		}
	});
};
function createCognitoUser(email) {
	return new AmazonCognitoIdentity.CognitoUser({
		Username: email,
		Pool: ipaStudy.userPool
	});
}
var onFailure = function registerFailure(err) {
	alert('Something went wrong with your registration.');
};