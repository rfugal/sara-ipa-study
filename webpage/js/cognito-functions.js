/*global ipaStudy _config AmazonCognitoIdentity AWSCognito*/

function loadSplash() {
	$('section').each(function() {
		$( this ).hide();
	}).ready(function(){
		$('[data-id=signupEmail_val]').val('');
		$('[data-id=loginEmail_val]').val('');
		$('section#splash_screen').show();
		$('form#loginForm').show();
		$('#loginForm').submit(function(event){
			event.preventDefault();
			var email = $('[data-id=loginEmail_val]').val();
			sessionStorage.setItem('email', email);
			trySignin(email);
		});
		$('#signupForm').submit(function(event){
			event.preventDefault();
			var email = $('[data-id=signupEmail_val]').val();
			sessionStorage.setItem('email', email);
			loadSignup();
		});
	});
}
function loadSignin() {
	$('section').each(function() {
		$( this ).hide();
	}).ready(function(){
		$('section#signin_screen').show();
		$('form#loginForm').hide();
		var fname = sessionStorage.getItem("fname");
		var email = sessionStorage.getItem('email');
		if(email && fname) {
			$('#signinEmail_display').text(email);
			$('#userFirstName_display').text(fname);
		} else if (email) {
			loadSignup();
		} else {
			loadSplash();
		}
		$('#signinForm').submit(function(event) {
			event.preventDefault();
			var password = $('#password').val();
			ipaStudy.signin(email, password, 
				function signInSuccess() {
					loadAccount();
				},
				function signInFailure(err) {
					$('#password').val('');
					alert(err);
					loadAccount();
				}
			);
		});
	});
}
function loadSignup() {
	$('section').each(function() {
		$( this ).hide();
	}).ready(function(){
		// prep
		$('#password1').val('');
		$('#password2').val('');
		$('#fname').val('');
		$('#noMatch_help').hide();
		
		$('section#signup_screen').show();
		var email = sessionStorage.getItem('email');
		if ( !(email) ) {
			loadSplash();
		} else {
			$('#signupEmail_display').text(email);
		}
		$('#registrationForm').submit(function submitRegistrationForm(event){
			event.preventDefault();
			var fname = $('#fname').val();
			if ($('#password1').val() === $('#password2').val()) {
				var password = $('#password1').val();
				sessionStorage.setItem("fname", fname);
				ipaStudy.register(fname, email, password, registrationSuccess, onFailure);
			} else {
				$('#password1').val('');
				$('#password2').val('');
				$('#noMatch_help').show();
			}
		});
	});
}
function loadAccount() {
	$('section').each(function() {
		$( this ).hide();
	}).ready(function(){
		$('section#account_screen').show();
		$('#alias_display').text(sessionStorage.getItem('fname'));
	});
}
function trySignin(email) {
	$.get('https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/', { 'email':email }, function(result) {
		if (result.statusCode === 200) {
			console.log('alias GET successful:\n', result);
			var fname = result.body.alias;
			sessionStorage.setItem("fname", fname);
			loadSignin();
			$('#loginForm').hide();
		} else {
			console.log('alias GET unsuccessful:\n', result);
			loadSignup();
		}
	});
}

//on first load
$(document).ready(function(){
	loadSplash();
});

function registrationSuccess(result) {
	var fname = sessionStorage.getItem("fname");
	var email = sessionStorage.getItem('email');
	var data = { 'email':email, 'alias':fname };
	$.post('https://0ugaks5lgg.execute-api.us-east-1.amazonaws.com/Prod/', data, function(result) {
		console.log('alias POST result:\n', result);
	});
	alert('Registration successful! Please check your email inbox or spam folder for your verification link.\nVerify your email before signing in.');
	loadSplash();
}

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