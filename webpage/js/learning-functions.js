// initialize learningRecord, learningContent, and ipaPhonemes
window.learningRecord = {
	'UID': null,
	'email': null,
	'start': null,
	'finish': null,
	'interactions': [],
	'finished': false,
	'ipaWPM': 30
};
window.learningContent = {
	'UID': null,
	'screen': null,
	'html': null,
	'title': null,
	'paragraphs': [],
	'phonemes': {}
};
window.timeOnTask = 0;
var totTimeout;

// load ipaPhonemes.json
var ipaPhonemesHttpRequest = new XMLHttpRequest();
ipaPhonemesHttpRequest.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
		window.ipaPhonemes = JSON.parse(this.responseText);
    }
};
ipaPhonemesHttpRequest.open("GET", "js/ipaPhonemes.json", true);
ipaPhonemesHttpRequest.send();

// initialize assessments
var ipaKnowledgeAssessment = {
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
};
var ReadingComprehensionAssessment = {
	'email': null,
	'type': null,
	'correct': [],
	'incorrect': [],
	'incorrectAnswers': {
		//	'1': 4
	},
	'wpm': 0
};

function updateTimeOnTask() {
	timer();
	var totMins = Math.floor(window.timeOnTask/60).toString();
	var totSecs = ("0" + (window.timeOnTask % 60).toString()).slice(-2);
	$('#timeLapsed').text(totMins + ":" + totSecs);
	window.timeOnTask++;
}
function timer() {
	totTimeout = setTimeout(updateTimeOnTask, 1000);
}

//on first load
$(document).ready(function(){
	var cognitoUser = ipaStudy.userPool.getCurrentUser();
	if (cognitoUser === null) {
		if (localStorage.getItem('email') !== null) {
			var email = localStorage.getItem('email');
			$.get('https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/', { 'request': 'alias', 'email':email }, function(result) {
				if (typeof result.alias !== "undefined" && result.alias !== null) {
					console.log('alias GET successful:\n', result);
					var fname = result.alias;
					var studyMethod = result.studyMethod;
					var email = localStorage.getItem('email');
					localStorage.setItem("fname", fname);
					localStorage.setItem('studyMethod', studyMethod);
					window.learningRecord.email = email;
					ipaKnowledgeAssessment.email = email;
					ReadingComprehensionAssessment.email = email;
					loadLearningScreen();
				} else {
					$('#loginForm').show();
					localStorage.setItem('email', null);
					window.location.replace('index.html');
				}
			});
		} else {
			window.location.replace('index.html');
		}
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
								console.log('email: ',email);
								window.learningRecord.email = email;
								ipaKnowledgeAssessment.email = email;
								ReadingComprehensionAssessment.email = email;
								localStorage.setItem('email', email);
								loadLearningScreen();
							}
						}
					});
					
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
	$(document).click(function (event) {
		var clickover = $(event.target);
		var _opened = $(".navbar-collapse").hasClass("show");
		if (_opened === true && !clickover.hasClass("navbar-toggler") ) {
			$("button.navbar-toggler").click();
		}
	});
	$('#unsure_checkbox').click(function(){
		if ($('#unsure_checkbox').hasClass('unsure')) {
			$('#unsure_checkbox')
				.removeClass('btn-warning unsure')
				.addClass('btn-outline-warning')
				.html('&#x25EF;&nbsp;&nbsp;I&rsquo;m not sure');
		} else {
			$('#unsure_checkbox')
				.removeClass('btn-outline-warning')
				.addClass('btn-warning unsure')
				.html('&#x2714;&nbsp;&nbsp;I&rsquo;m not sure');
		}
	});
	$('.timedLearning').on('hide.bs.modal', function() {
		if (window.learningRecord.start !== null && window.learningRecord.finish !== null) {
			window.learningRecord.start = $.now() - (window.learningRecord.finish - window.learningRecord.start);
			window.learningRecord.finish = null;
		} else {
			window.learningRecord.start = $.now();
			window.learningRecord.finish = null;
		}
        timer();
	});
});

function openLearningModal() {
	if (($('.modal').data('bs.modal') || {})._isShown) {
		return;
	}
    clearTimeout(totTimeout);
	if (window.learningRecord.start !== null) {
		window.learningRecord.finish = $.now();
	}
	if (window.learningRecord.interactions.length > 0) {
		putLearningRecord();
	}
/*
	$('main div.modal').each(function() {
		$( this ).modal('hide');
	}).ready(function() {
*/
		switch(window.learningContent.screen) {
			case '#firstReadingAssessment':
				$('#modal_firstReadingAssessment').modal('show');
				break;
			case '#secondReadingAssessment':
				$('#modal_secondReadingAssessment').modal('show');
				break;
			case '#learnImmersiveText':
				$('#modal_immersionInstructions').modal('show');
				break;
			case '#ipaReadingSpeed':
				$('#modal_ipaReadingSpeed').modal('show');
				break;
			case '#firstIpaAssessment':
				$('#modal_firstIpaAssessment').modal('show');
				break;
			case '#secondIpaAssessment':		
				$('#modal_secondIpaAssessment').modal('show');
				break;
		}		
/*
	});
*/
}

function loadLearningScreen() {
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

function updateLearnScreenDiv() {
	$('div.mainReader').each(function(){
		$( this ).hide();
	}).ready(function(){
		updateLearningContent();
	});
}

function updateLearningContent() {
	clearTimeout(totTimeout);
	window.timeOnTask = 0;
	$('#timeLapsed').text('0:00');
	$.get('https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/', 
		  { 'request': 'content', 'email': window.learningRecord.email }, 
		  function(result) {
		if (typeof result.screen !== "undefined" && result.screen !== null) {
			window.learningContent.UID = result.UID;
			window.learningRecord.UID = result.UID;
			window.learningContent.screen = result.screen;
			window.learningContent.html = result.html;
			window.learningContent.title = result.title;
			window.learningContent.paragraphs = result.paragraphs;
			window.learningContent.phonemes = result.phonemes;
			window.learningRecord.ipaWPM = parseInt(result.ipaWPM);
			localStorage.setItem('studyMethod', parseInt(result.studyMethod));
			$( window.learningContent.screen ).show();
			if (window.learningContent.screen === '#learnImmersiveText') {
				window.loadImmersiveText();
			}
            $(window).scrollTop(0);
			openLearningModal();
		} else {
			alert('Sorry, something went wrong when connecting with the server.');
			ipaStudy.signOut();
		}
	});
}

function finishedImmersiveText() {
	$('#learnImmersiveText').hide();
	$('#loadingNext').show();
	window.learningRecord.finish = $.now();
	window.learningRecord.finished = true;
	var w = $('#learnImmersiveText').find('span').length;
	var m = (window.learningRecord.finish - window.learningRecord.start) / 60000;
	window.learningRecord.ipaWPM = Math.floor(w / m);
	putLearningRecord();
}

function putLearningRecord() {
	var updateScreenFlag = (window.learningRecord.finished) ? true : false;
	$.ajax({
		method: 'PUT',
		url: 'https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/',
		data: { 'request': 'record', 'learningRecord': JSON.stringify($.extend({},window.learningRecord)) },
		async: false,
		timeout: 3000
	});
	if (updateScreenFlag) {
		updateLearnScreenDiv();
	}
	window.learningRecord.finished = false;
	window.learningRecord.start = null;
	window.learningRecord.finish = null;
	window.learningRecord.interactions = [];
}

function putAssessment(assessment) {
	$.ajax({
		'method': 'PUT',
		'url': 'https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/',
		'data': { 'request': 'assessment', 'assessment': JSON.stringify(assessment) }
	});
}

function assesReadingComprehension() {
	if (window.learningRecord.finish === null) {
		window.learningRecord.finish = $.now();
	}
	$('#modal_ReadingAssessmentComprehension').modal('hide');
	var index = 0;
	var question = {};
	switch(window.learningContent.screen) {
		case '#firstReadingAssessment':
			index = (firstReadingComprehension.length === 0) ? 0 : 3 - firstReadingComprehension.length;
			break;
		case '#secondReadingAssessment':
			index = (secondReadingComprehension.length === 0) ? 0 : 6 - secondReadingComprehension.length;
			break;
		case '#firstIpaAssessment':
			index = (firstIpaComprehension.length === 0) ? 0 : 5 - firstIpaComprehension.length;
			break;
		case '#secondIpaAssessment':
			index = (secondIpaComprehension.length === 0) ? 0 : 6 - secondIpaComprehension.length;
			break;
	}
	if (index === 0) {
		var w = 100;
		var m = (window.learningRecord.finish - window.learningRecord.start) / 60000;
		switch(window.learningContent.screen) {
			case '#firstReadingAssessment':
				window.learningContent.screen = '#secondReadingAssessment';
				ReadingComprehensionAssessment.type = 'firstReadingAssessment';
				w = 214;
				break;
			case '#secondReadingAssessment':
				window.learningContent.screen = '#initialIpaKnowledge';
				ReadingComprehensionAssessment.type = 'secondReadingAssessment';
				w = 754;
				break;
			case '#firstIpaAssessment':
				ReadingComprehensionAssessment.type = 'firstIpaAssessment';
				w = 527;
				break;
			case '#secondIpaAssessment':
				ReadingComprehensionAssessment.type = 'secondIpaAssessment';
				w = 1552;
				break;
		}
		window.learningRecord.ipaWPM = Math.floor(w / m);
		ReadingComprehensionAssessment.wpm = Math.floor(w / m);
		var durationMinutes = Math.round(754 / window.learningRecord.ipaWPM);
		var durationText = (durationMinutes === 1) ? ' minute' : ' minutes';
		durationText = durationMinutes.toString() + durationText;
		$('#secondReadingAssessmentDuration').text( durationText );
		window.learningRecord.finished = true;
		putLearningRecord();
		putAssessment($.extend({}, ReadingComprehensionAssessment));
		ReadingComprehensionAssessment.type = null;
		ReadingComprehensionAssessment.correct = [];
		ReadingComprehensionAssessment.incorrect = [];
		ReadingComprehensionAssessment.incorrectAnswers = {};
		return;
	}
	switch(window.learningContent.screen) {
		case '#firstReadingAssessment':
			question = firstReadingComprehension.shift();
			break;
		case '#secondReadingAssessment':
			question = secondReadingComprehension.shift();
			break;
		case '#firstIpaAssessment':
			question = firstIpaComprehension.shift();
			break;
		case '#secondIpaAssessment':
			question = secondIpaComprehension.shift();
			break;
	}
	var questionCount = 5;
	switch(window.learningContent.screen) {
		case "#firstReadingAssessment":
			questionCount = 2;
			break;
		case "#firstIpaAssessment":
			questionCount = 4;
			break;
	}
	$('#ReadingAssessmentComprehension_questionIndex').text('Question ' + (index) + ' of ' + (questionCount));
	$('#ReadingAssessmentComprehension_body').text(question.question);
	var choice = 0;
	$('#ReadingAssessmentComprehension_options input').each(function() {
		if (choice === 3 && window.learningContent.screen === "#firstIpaAssessment") {
			$( this ).hide();
			return;
		} else if (choice === 3 && window.learningContent.screen === "#secondIpaAssessment") {
			$( this ).show();
		}
		var option = question.choices[choice];
		choice += 1;
		$( this ).val(option)
			.attr('data-option', choice.toString())
			.attr('data-correct', question.answer.toString())
			.attr('data-questionNum', index.toString())
			.removeClass('btn-success btn-danger tada headShake fadeInLeft fadeOutRight');
	});
	$('#ReadingAssessmentComprehension_options input').off().addClass('disabled animated fadeInLeft');
	$('#modal_ReadingAssessmentComprehension').modal('show');
	setTimeout(function(){ $('#ReadingAssessmentComprehension_options input')
		.removeClass('disabled').off()
		.on('click', ComprehensionMatchTest); }, 500);
}

function ComprehensionMatchTest() {
	$('#ReadingAssessmentComprehension_options input').off();
	$('#ReadingAssessmentComprehension_options input').addClass('disabled');
	var option = $( this ).attr('data-option');
	var correct = $( this ).attr('data-correct');
	var questionNum = $( this ).attr('data-questionNum');
	if (option === correct) {
		$( this ).addClass('btn-success tada');
		ReadingComprehensionAssessment.correct.push(questionNum);
	} else {
		$( this ).addClass('btn-danger headShake');
		ReadingComprehensionAssessment.incorrectAnswers[questionNum] = option;
		ReadingComprehensionAssessment.incorrect.push(questionNum);
	}
	setTimeout(function(){ $('#ReadingAssessmentComprehension_options input').addClass('fadeOutRight'); }, 500);
	setTimeout(function(){ assesReadingComprehension(); }, 1500);
}

function assessIpaKnowledge() {
	$('#modal_initialIpaKnowledge').modal('hide');
	$('#unsure_checkbox')
		.removeClass('btn-warning unsure')
		.addClass('btn-outline-warning')
		.html('&#x25EF;&nbsp;&nbsp;I&rsquo;m not sure');
	var index = 
		ipaKnowledgeAssessment.certain.correct.length + 
		ipaKnowledgeAssessment.certain.incorrect.length +
		ipaKnowledgeAssessment.uncertain.correct.length + 
		ipaKnowledgeAssessment.uncertain.incorrect.length;
	if (index === 12) {
		ipaKnowledgeAssessment.type =
			(window.learningContent.screen === '#initialIpaKnowledge') ? 'initialIpaKnowledge' : 'finalIpaKnowledge';
		putAssessment(ipaKnowledgeAssessment);
		window.learningRecord.finished = true;
		putLearningRecord();
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
		if ($('#unsure_checkbox').hasClass('unsure')) {
			ipaKnowledgeAssessment.uncertain.correct.push(correct);
		} else {
			ipaKnowledgeAssessment.certain.correct.push(correct);
		}
	} else {
		$( this ).addClass('btn-primary');
		var wrongAnswer = {
			'character': option,
			'word': word
		};
		ipaKnowledgeAssessment.incorrectAnswers[correct] = wrongAnswer;
		if ($('#unsure_checkbox').hasClass('unsure')) {
			ipaKnowledgeAssessment.uncertain.incorrect.push(correct);
		} else {
			ipaKnowledgeAssessment.certain.incorrect.push(correct);
		}
	}
	setTimeout(function(){ $('#initialIpaKnowledge_options input').addClass('fadeOutRight'); }, 500);
	setTimeout(function(){ assessIpaKnowledge(); }, 1500);
}


// Amazon Cognito Functions
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
	localStorage.setItem('email', null);
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

// Assesment Questions
var firstReadingComprehension = [
	{
		'question': 'According to the text, what is one of Chimamanda Ngozi Adichie\u2019s most popular novels called?',
		'answer': 3,
		'choices': ['A. Chinua Achebe', 'B. Biafran War', 'C. Half of a Yellow Sun', 'D. Americanah']
	},
	{
		'question': 'Which of the following shows the sequence of events as described in the passage in the correct order?',
		'answer': 3,
		'choices': ['A. Chimamanda had a passion for literature, majored in creative writing, studied medicine in Nigeria, and then moved to the United States.', 'B. Chimamanda had a passion for literature, moved to the United States, majored in creative writing, and then studied medicine in Nigeria.', 'C. Chimamanda had a passion for literature, studied medicine in Nigeria, moved to the United States, and then majored in creative writing.', 'D. Chimamanda studied medicine in Nigeria, moved to the United States, majored in creative writing, and then had a passion for literature.']
	}/*,
	{
		'question': 'Based on the text, what conclusion can you make about Chimamanda\u2019s interests?',
		'answer': 1,
		'choices': ['A. By the end of graduate school, Chimamanda became more interested in her early passion for literature than studying medicine.', 'B. By the end of graduate school, Chimamanda became less interested in her early passion for literature than studying medicine.', 'C. By the end of graduate school, Chimamanda became just as interested in both her early passion for literature and studying medicine.', 'D. By the end of graduate school, Chimamanda lost her interest in both her early passion for literature and studying medicine.']
	},
	{
		'question': 'Based on the text, what likely influenced Chimamanda\u2019s writing?',
		'answer': 3,
		'choices': ['A. Chimamanda living in Nigeria likely influenced her writing, but living in the United States did not influence her writing.', 'B. Chimamanda living in the United States likely influenced her writing, but living in Nigeria did not influence her writing.', 'C. Chimamanda living in Nigeria and living in the United States both likely influenced her writing.', 'D. Chimamanda living in Nigeria and living in the United States both likely did not influence her writing.']
	},
	{
		'question': 'What is the main idea of the text?',
		'answer': 2,
		'choices': ['A. Chimamanda Ngozi Adichie did not want to be a writer at first, so she studied medicine in Nigeria and then decided to move to the United States to study communication and political science.', 'B. Although Chimamanda Ngozi Adichie developed an early passion for literature in Nigeria, she studied other subjects before finally becoming a writer and writing some novels, even earning awards for her writing.', 'C. One of Chimamanda Ngozi Adichie\u2019s most popular novels is Half of a Yellow Sun, which is a story about three characters before and during Nigeria\u2019s Biafran War, and the novel has even been adapted into a movie.', 'D. One of the recent novels by Chimamanda Ngozi Adichie is about the experience of a Nigerian girl studying at an American college, and Chimamanda denies that the story is about her own experience.']
	}*/
];

var secondReadingComprehension = [
	{
		'question': 'What is the one thing that Andreas likes more than science?',
		'answer': 2,
		'choices': ['A. his friend Tyrell', 'B. basketball', 'C. baseball', 'D. video games']
	},
	{
		'question': 'Every night after dinner, Andreas goes outside and practices shooting baskets. What motivates this action?',
		'answer': 4,
		'choices': ['A. Andreas wants to beat Tyrell at basketball.', 'B. Andreas wants to show off for his parents.', 'C. Andreas wants to avoid doing his homework.', 'D. Andreas wants to make the basketball team.']
	},
	{
		'question': 'What conclusion does the text best support?',
		'answer': 1,
		'choices': ['A. It is important to both Andreas and Tyrell that they make the team together.', 'B. Andreas and Tyrell secretly don\u2019t care whether the other one makes the team.', 'C. Andreas and Tyrell\u2019s friendship is based on competition.', 'D. Andreas and Tyrell will play better basketball together since they made the team together.']
	},
	{
		'question': '\u201cAndreas thought it was the best sound in the world.\u201d Why might Andreas think this is the best sound?',
		'answer': 3,
		'choices': ['A. because it means he missed the net', 'B. because it is simply a pleasant sound', 'C. because it means he scored a basket', 'D. because it means the other team scored']
	},
	{
		'question': 'What is this story mostly about?',
		'answer': 3,
		'choices': ['A. how to play the game of basketball', 'B. practicing in preparation for tryouts', 'C. two friends making a basketball team together', 'D. the friendship between two boys']
	}
];
var firstIpaComprehension = [
	{
		'question': 'What does Alyssa get at the department store?',
		'answer': 2,
		'choices': ['A. art supplies', 'B. a bow tie', 'C. a pair of shoes']
	},
	{
		'question': 'Why does Alyssa become embarrassed by her bow tie?',
		'answer': 1,
		'choices': ['A. Aveed says that bow ties are for boys.', 'B. Alyssa\u2019s mom said that bow ties are for boys.', 'C. Aveed won\u2019t speak to Alyssa when he sees her bow tie.']
	},
	{
		'question': 'Alyssa does not feel embarrassed by her bow tie after she speaks with the 7th grader. Which evidence from the story supports this statement?',
		'answer': 3,
		'choices': ['A. The older girl says to Alyssa, \u201CI like your bow tie!\u201D', 'B. One of Alyssa\u2019s classmates says, \u201CBow ties are for boys.\u201D', 'C. Alyssa can\u2019t wait to show her bow tie to her art teacher.']
	},
	{
		'question': 'What does Alyssa end up thinking about her bow tie?',
		'answer': 1,
		'choices': ['A. The bow tie shows that she is creative.', 'B. The bow tie does not show how creative she is.', 'C. She should not have worn the bow tie to school.']
	},
	{
		'question': 'What is a theme of this story?',
		'answer': 1,
		'choices': ['A. You shouldn\u2019t be embarrassed for being creative.', 'B. Only boys should wear bow ties to school.', 'C. Your parents know what is best for you.']
	}
];
var secondIpaComprehension = [
	{
		'question': 'Where does Gina\u2019s family live?',
		'answer': 2,
		'choices': ['A. in the forest', 'B. in an old hotel', 'C. in an old school', 'D. in a fox den']
	},
	{
		'question': 'How does Gina deal with the problem of the fox portal?',
		'answer': 3,
		'choices': ['A. swimming through the foxes', 'B. running out of the hotel ', 'C. chanting a spell from a book', 'D. calling her parents for help']
	},
	{
		'question': 'The hotel that Gina visits after falling off her bike is magical. What evidence from the story supports this conclusion?',
		'answer': 1,
		'choices': ['A. Foxes appear from a hole in the bookcase.', 'B. The hallway is longer than Gina remembers.', 'C. Gina walks through a door with a fox-shaped handle.', 'D. Marilyn and Melinda drink champagne and white tea.']
	},
	{
		'question': 'What can be inferred about Gina\u2019s experience with Marilyn, Melinda, and the Fox Hunter?',
		'answer': 4,
		'choices': ['A. Gina\u2019s experience with Marilyn, Melinda, and the Fox Hunter taught her to be careful around strangers.', 'B. Gina does not want to see Marilyn, Melinda, and the Fox Hunter again.', 'C. Gina experience with Marilyn, Melinda, and the Fox Hunter took place in reality.', 'D. Gina imagined or dreamt her experience with Marilyn, Melinda, and the Fox Hunter.']
	},
	{
		'question': 'What is this story mostly about?',
		'answer': 1,
		'choices': ['A. a mysterious hotel with a portal to foxes', 'B. a family that moves to an old hotel', 'C. a girl who crashes her bike and is late to school', 'D. a book called The Curious Situation of Foxes']
	}
];