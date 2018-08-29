ti// JavaScript Document
// word match modal functions
// Copyright 2018 Russ Fugal

sessionStorage.setItem('interactionIndex', 2);

function prepModal(lexigram, reveal, method) {
	if (method === 'phonemeMapSpan') prepPhonemeMapModal(lexigram, reveal);
	if (method === 'wordRevealSpan') prepWordRevealModal(lexigram, reveal);
	if (method === 'wordMatchSpan') prepWordMatchModal(lexigram, reveal);
}
function prepPhonemeMapModal(lexigram, reveal) {
	$('#phonemeMap_body').html('');
	$('#phonemeMap_title').text(lexigram);
	$.each(lexigram.split(''), function(index, alpha) {
		var skips = ['\u02c8','\u02cc'];
		if ( !skips.includes(alpha) ) {
			var sound = wolf.phonemes[alpha].sound;
			var asIn = reveal;
			while ( asIn === reveal ) {
				asIn = window.shuffle(wolf.phonemes[alpha].asIn)[0];
			}
			var p = document.createElement('p');
			p.textContent = alpha + ' - ' + sound + ' ' + asIn;
			$('#phonemeMap_body').append(p);
		}
	});
	$('#modal_phonemeMap').modal('show');
}
function prepWordRevealModal(lexigram, reveal) {
	$('#wordReveal_body').html('');
	$('#wordReveal_title').text(lexigram);
	$('#wordReveal_body').text(reveal);
	$('#modal_wordReveal').modal('show');
}
function prepWordMatchModal(lexigram, reveal) {
	// set variables: lexigram (selected by user), reveal (transation) and 2 alternate options
	var correctMatch = ( Math.random() * 3 ) << 0;
	var option1 = (correctMatch === 0) ? lexigram : createVariation(lexigram);
	var option2 = (correctMatch === 1) ? lexigram : createVariation(lexigram, [option1]);
	var option3 = (correctMatch === 2) ? lexigram : createVariation(lexigram, [option1, option2]);
	
	// set modal title to lexigram
	$('#wordMatch_title').text(lexigram);
	
	// prep 3 options for user input
	$('#modal_wordMatch .modal-body input')
		.addClass('btn-primary')
		.removeClass('btn-success btn-danger animated headShake tada disabled');
	$('#wordMatch_option1').val(option1);
	$('#wordMatch_option2').val(option2);
	$('#wordMatch_option3').val(option3);
	$('body').on('click', '#modal_wordMatch .modal-body input', wordMatchTest);
	
	// prep reveal section
	$('#wordMatch_reveal').hide().html(lexigram + '<br/>' + reveal);
	$('#wordMatch_close').hide();
	$('#wordMatch_hidden').show();
	$('#modal_wordMatch').modal('show');
}

function createVariation(lexigram, excludedList = [] ) {
	if (lexigram.length === 1) {
		return pairs[lexigram];
	}
	excludedList.push(lexigram);
	var variation = lexigram;
	var count = 0;
	while ( excludedList.includes(variation) ) {
		var swapIndex = ( Math.random() * (lexigram.length - 1) + 1 ) << 0;
		var swapLetter = (count < 32) ? lexigram[swapIndex - 1] : lexigram[swapIndex];
		var swapPair = pairs[lexigram[swapIndex]];
		console.log(swapLetter, swapPair);
		variation = lexigram.replace(swapLetter, swapPair);
		console.log(variation, count);
		count += 1;
		if (count > 32) {
			return variation;
		}
	}
	return variation;
}

function freezeWordMatchModal() {
	// disable user inputs in word match modal
	$('#modal_wordMatch .modal-body input').addClass('disabled');
	$('body').off('click', '#modal_wordMatch .modal-body input', wordMatchTest);
}

function tadaWordMatch() {
	// animate inputs to redirect user (incorrect click)
	$('#modal_wordMatch .modal-body input').addClass('animated tada');
}

function wordMatchTest() {
	freezeWordMatchModal();
	// pull variables for match test
	var testLexigram = this.value;
	var matchLexigram = $('#wordMatch_title').text();
	
	// test for match
	if (testLexigram === matchLexigram) {
		// reveal translation
		$('#wordMatch_hidden').hide();
		$('#wordMatch_reveal').show();
		
		// highlight correct choice
		this.classList.add('btn-success');
		this.classList.remove('btn-secondary');
	} else {
		// animate incorrect choice
		this.classList.remove('btn-primary');
		this.classList.add('btn-danger');
		this.classList.add('animated');
		this.classList.add('headShake');
		
		// increase cost to user of incorrect choice
		$('#wordMatch_hidden').hide();
		$('#wordMatch_close').show();
	}
}

window.loadLearn = function loadLearn() {
	var interactionIndex = parseInt(sessionStorage.getItem('interactionIndex'));	
	// cycle interaction methods
	interactionIndex = (interactionIndex === 2) ? 0 : interactionIndex + 1;
	sessionStorage.setItem('interactionIndex', interactionIndex);
	
	$('section').each(function() {
		$( this ).hide();
	}).ready(function(){
		$('div.mainReader').each(function(){
			$( this ).hide();
		}).ready(function(){
			$('#learnImmersiveText').show();
			$('section#learn_screen').show();
		});
	});
	$('#modal_wordMatch').on('hide.bs.modal', freezeWordMatchModal);
	$('#modal_immersionInstructions').modal('show');
	$('#learnImmersiveText').html('');
	window.learningRecord.title = wolf.title;
	window.learningRecord.interactions = [];
	var spanIndex = 0;
	$.each( wolf.paragraphs, function(paragraphIndex, paragraph) {
		var interactionMethod = 'wordMatchSpan';
		interactionMethod = (interactionIndex === 0) ? 'phonemeMapSpan' : interactionMethod;
		interactionMethod = (interactionIndex === 1) ? 'wordRevealSpan' : interactionMethod;
		var p = document.createElement('p');
		$.each(paragraph, function(lexigramIndex, lex) {
			var span = document.createElement('span');
			span.textContent = lex.displayText;
			span.setAttribute('data-lexigram', lex.lexigram);
			span.setAttribute('data-reveal', lex.reveal);
			span.setAttribute('data-index', spanIndex.toString());
			spanIndex += 1;
			span.setAttribute('style', 'white-space:nowrap;');
			span.setAttribute('class', interactionMethod);
			p.appendChild(span);
			p.appendChild(document.createTextNode(' '));
		});
		$('#learnImmersiveText').append(p);
	});
	var done = document.createElement('div');
	done.textContent = 'Done';
	done.setAttribute('class', 'btn btn-outline-success my-2 my-sm-0 float-right');
	done.setAttribute('onClick', 'updateLearnScreenDiv()');
	$('#learnImmersiveText').append(done);
	$('#learnImmersiveText span').on('click', function() {
		var lexigram = $(this).attr('data-lexigram');
		var reveal = $(this).attr('data-reveal');
		var method = $(this).attr('class').match(/\S+/g)[0];
		$(this).addClass('interacted');
		prepModal(lexigram, reveal, method);
	});
}
window.shuffle = function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

var pairs = {"\u025b": "\u00f0", "r": "\u0259", "\u028c": "w", "z": "\u026a", "n": "\u00e6", "s": "\u02c8", "u": "t", "\u0283": "\u02c8", "p": "\u025b", "\u0259": "\u00f0", "d": "n", "\u0254": "f", "\u026a": "e", "\u0251": "w", "\u02a7": "\u0251", "l": "\u028a", "k": "\u02c8", "i": "h", "t": "s", "f": "l", "\u028a": "o", "v": "\u028c", "m": "\u028c", "a": "d", "\u00e6": "\u00f0", "\u02c8": "n", "o": "s", "e": "r", "\u014b": "\u026a", "\u02a4": "\u0259", "\u025c": "h", "\u00f0": "\u026a", "\u0292": "\u025b", "j": "f", "g": "\u02c8", "h": "\u02cc", "w": "\u0259", "\u02cc": "r", "b": "\u02c8", "\u03b8": "\u02c8"}

var wolf = {
	title: "The Boy who Cried Wolf",
	paragraphs: [
		[
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "b\u0254\u026a",
				"lexigram": "b\u0254\u026a",
				"reveal": "boy"
			},
			{
				"displayText": "hu",
				"lexigram": "hu",
				"reveal": "who"
			},
			{
				"displayText": "kra\u026ad",
				"lexigram": "kra\u026ad",
				"reveal": "cried"
			},
			{
				"displayText": "w\u028alf",
				"lexigram": "w\u028alf",
				"reveal": "wolf"
			},
		],
		[
			{
				"displayText": "\u00f0\u025br",
				"lexigram": "\u00f0\u025br",
				"reveal": "there"
			},
			{
				"displayText": "w\u028cz",
				"lexigram": "w\u028cz",
				"reveal": "was"
			},
			{
				"displayText": "w\u028cns",
				"lexigram": "w\u028cns",
				"reveal": "once"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "pur",
				"lexigram": "pur",
				"reveal": "poor"
			},
			{
				"displayText": "\u02c8\u0283\u025bp\u0259rd",
				"lexigram": "\u02c8\u0283\u025bp\u0259rd",
				"reveal": "shepherd"
			},
			{
				"displayText": "b\u0254\u026a",
				"lexigram": "b\u0254\u026a",
				"reveal": "boy"
			},
			{
				"displayText": "hu",
				"lexigram": "hu",
				"reveal": "who"
			},
			{
				"displayText": "juzd",
				"lexigram": "juzd",
				"reveal": "used"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "to"
			},
			{
				"displayText": "w\u0251\u02a7",
				"lexigram": "w\u0251\u02a7",
				"reveal": "watch"
			},
			{
				"displayText": "h\u026az",
				"lexigram": "h\u026az",
				"reveal": "his"
			},
			{
				"displayText": "fl\u0251ks",
				"lexigram": "fl\u0251ks",
				"reveal": "flocks"
			},
			{
				"displayText": "\u026an",
				"lexigram": "\u026an",
				"reveal": "in"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "fildz",
				"lexigram": "fildz",
				"reveal": "fields"
			},
			{
				"displayText": "n\u025bkst",
				"lexigram": "n\u025bkst",
				"reveal": "next"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "to"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "d\u0251rk",
				"lexigram": "d\u0251rk",
				"reveal": "dark"
			},
			{
				"displayText": "\u02c8f\u0254r\u0259st",
				"lexigram": "\u02c8f\u0254r\u0259st",
				"reveal": "forest"
			},
			{
				"displayText": "n\u026ar",
				"lexigram": "n\u026ar",
				"reveal": "near"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "f\u028at",
				"lexigram": "f\u028at",
				"reveal": "foot"
			},
			{
				"displayText": "\u028cv",
				"lexigram": "\u028cv",
				"reveal": "of"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "\u02c8ma\u028ant\u0259n.",
				"lexigram": "\u02c8ma\u028ant\u0259n",
				"reveal": "mountain"
			},
			{
				"displayText": "w\u028cn",
				"lexigram": "w\u028cn",
				"reveal": "one"
			},
			{
				"displayText": "h\u0251t",
				"lexigram": "h\u0251t",
				"reveal": "hot"
			},
			{
				"displayText": "\u02cc\u00e6ft\u0259r\u02c8nun,",
				"lexigram": "\u02cc\u00e6ft\u0259r\u02c8nun",
				"reveal": "afternoon"
			},
			{
				"displayText": "hi",
				"lexigram": "hi",
				"reveal": "he"
			},
			{
				"displayText": "\u03b8\u0254t",
				"lexigram": "\u03b8\u0254t",
				"reveal": "thought"
			},
			{
				"displayText": "\u028cp",
				"lexigram": "\u028cp",
				"reveal": "up"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "g\u028ad",
				"lexigram": "g\u028ad",
				"reveal": "good"
			},
			{
				"displayText": "pl\u00e6n",
				"lexigram": "pl\u00e6n",

				"reveal": "plan"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "to"
			},
			{
				"displayText": "g\u025bt",
				"lexigram": "g\u025bt",
				"reveal": "get"
			},
			{
				"displayText": "s\u028cm",
				"lexigram": "s\u028cm",
				"reveal": "some"
			},
			{
				"displayText": "\u02c8k\u028cmp\u0259ni",
				"lexigram": "\u02c8k\u028cmp\u0259ni",
				"reveal": "company"
			},
			{
				"displayText": "f\u0254r",
				"lexigram": "f\u0254r",
				"reveal": "for"
			},
			{
				"displayText": "h\u026am\u02c8s\u025blf",
				"lexigram": "h\u026am\u02c8s\u025blf",
				"reveal": "himself"
			},
			{
				"displayText": "\u00e6nd",
				"lexigram": "\u00e6nd",
				"reveal": "and"
			},
			{
				"displayText": "\u02c8\u0254lso\u028a",
				"lexigram": "\u02c8\u0254lso\u028a",
				"reveal": "also"
			},
			{
				"displayText": "h\u00e6v",
				"lexigram": "h\u00e6v",
				"reveal": "have"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "\u02c8l\u026at\u0259l",
				"lexigram": "\u02c8l\u026at\u0259l",
				"reveal": "little"
			},
			{
				"displayText": "f\u028cn.",
				"lexigram": "f\u028cn",
				"reveal": "fun"
			},
			{
				"displayText": "\u02c8re\u026az\u026a\u014b",
				"lexigram": "\u02c8re\u026az\u026a\u014b",
				"reveal": "raising"
			},
			{
				"displayText": "h\u026az",
				"lexigram": "h\u026az",
				"reveal": "his"
			},
			{
				"displayText": "f\u026ast",
				"lexigram": "f\u026ast",
				"reveal": "fist"
			},
			{
				"displayText": "\u026an",
				"lexigram": "\u026an",
				"reveal": "in"
			},
			{
				"displayText": "\u00f0i",
				"lexigram": "\u00f0i",
				"reveal": "the"
			},
			{
				"displayText": "\u025br,",
				"lexigram": "\u025br",
				"reveal": "air"
			},
			{
				"displayText": "hi",
				"lexigram": "hi",
				"reveal": "he"
			},
			{
				"displayText": "r\u00e6n",
				"lexigram": "r\u00e6n",
				"reveal": "ran"
			},
			{
				"displayText": "da\u028an",
				"lexigram": "da\u028an",
				"reveal": "down"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "to"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "\u02c8v\u026al\u0259\u02a4",
				"lexigram": "\u02c8v\u026al\u0259\u02a4",
				"reveal": "village"
			},
			{
				"displayText": "\u02c8\u0283a\u028at\u026a\u014b",
				"lexigram": "\u02c8\u0283a\u028at\u026a\u014b",
				"reveal": "shouting"
			},
			{
				"displayText": "\u201cw\u028alf,",
				"lexigram": "w\u028alf",
				"reveal": "wolf"
			},
			{
				"displayText": "w\u028alf.\u201d",
				"lexigram": "w\u028alf",
				"reveal": "wolf"
			},
			{
				"displayText": "\u00e6z",
				"lexigram": "\u00e6z",
				"reveal": "as"
			},
			{
				"displayText": "sun",
				"lexigram": "sun",
				"reveal": "soon"
			},
			{
				"displayText": "\u00e6z",
				"lexigram": "\u00e6z",
				"reveal": "as"
			},
			{
				"displayText": "\u00f0e\u026a",
				"lexigram": "\u00f0e\u026a",
				"reveal": "they"
			},
			{
				"displayText": "h\u025crd",
				"lexigram": "h\u025crd",
				"reveal": "heard"
			},
			{
				"displayText": "h\u026am,",
				"lexigram": "h\u026am",
				"reveal": "him"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "\u02c8v\u026al\u026a\u02a4\u0259rz",
				"lexigram": "\u02c8v\u026al\u026a\u02a4\u0259rz",
				"reveal": "villagers"
			},
			{
				"displayText": "\u0254l",
				"lexigram": "\u0254l",
				"reveal": "all"
			},
			{
				"displayText": "r\u028c\u0283t",
				"lexigram": "r\u028c\u0283t",
				"reveal": "rushed"
			},
			{
				"displayText": "fr\u028cm",
				"lexigram": "fr\u028cm",
				"reveal": "from"
			},
			{
				"displayText": "\u00f0\u025br",
				"lexigram": "\u00f0\u025br",
				"reveal": "their"
			},
			{
				"displayText": "ho\u028amz,",
				"lexigram": "ho\u028amz",
				"reveal": "homes"
			},
			{
				"displayText": "f\u028al",
				"lexigram": "f\u028al",
				"reveal": "full"
			},
			{
				"displayText": "\u028cv",
				"lexigram": "\u028cv",
				"reveal": "of"
			},
			{
				"displayText": "k\u0259n\u02c8s\u025crn",
				"lexigram": "k\u0259n\u02c8s\u025crn",
				"reveal": "concern"
			},
			{
				"displayText": "f\u0254r",
				"lexigram": "f\u0254r",
				"reveal": "for"
			},
			{
				"displayText": "h\u026az",
				"lexigram": "h\u026az",
				"reveal": "his"
			},
			{
				"displayText": "\u02c8se\u026afti,",
				"lexigram": "\u02c8se\u026afti",
				"reveal": "safety"
			},
			{
				"displayText": "\u00e6nd",
				"lexigram": "\u00e6nd",
				"reveal": "and"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "two"
			},
			{
				"displayText": "\u028cv",
				"lexigram": "\u028cv",
				"reveal": "of"
			},
			{
				"displayText": "h\u026az",
				"lexigram": "h\u026az",
				"reveal": "his"
			},
			{
				"displayText": "\u02c8k\u028cz\u0259nz",
				"lexigram": "\u02c8k\u028cz\u0259nz",
				"reveal": "cousins"
			},
			{
				"displayText": "\u02c8iv\u026an",
				"lexigram": "\u02c8iv\u026an",
				"reveal": "even"
			},
			{
				"displayText": "ste\u026ad",
				"lexigram": "ste\u026ad",
				"reveal": "stayed"
			},
			{
				"displayText": "w\u026a\u00f0",
				"lexigram": "w\u026a\u00f0",
				"reveal": "with"
			},
			{
				"displayText": "h\u026am",
				"lexigram": "h\u026am",
				"reveal": "him"
			},
			{
				"displayText": "f\u0254r",
				"lexigram": "f\u0254r",
				"reveal": "for"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "\u0283\u0254rt",
				"lexigram": "\u0283\u0254rt",
				"reveal": "short"
			},
			{
				"displayText": "wa\u026al.",
				"lexigram": "wa\u026al",
				"reveal": "while"
			},
			{
				"displayText": "\u00f0\u026as",
				"lexigram": "\u00f0\u026as",
				"reveal": "this"
			},
			{
				"displayText": "ge\u026av",
				"lexigram": "ge\u026av",
				"reveal": "gave"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "b\u0254\u026a",
				"lexigram": "b\u0254\u026a",
				"reveal": "boy"
			},
			{
				"displayText": "so\u028a",
				"lexigram": "so\u028a",
				"reveal": "so"
			},
			{
				"displayText": "m\u028c\u02a7",
				"lexigram": "m\u028c\u02a7",
				"reveal": "much"
			},
			{
				"displayText": "\u02c8pl\u025b\u0292\u0259r",
				"lexigram": "\u02c8pl\u025b\u0292\u0259r",
				"reveal": "pleasure"
			},
			{
				"displayText": "\u00f0\u00e6t",
				"lexigram": "\u00f0\u00e6t",
				"reveal": "that"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "fju",
				"lexigram": "fju",
				"reveal": "few"
			},
			{
				"displayText": "de\u026az",
				"lexigram": "de\u026az",
				"reveal": "days"
			},
			{
				"displayText": "\u02c8le\u026at\u0259r",
				"lexigram": "\u02c8le\u026at\u0259r",
				"reveal": "later"
			},
			{
				"displayText": "hi",
				"lexigram": "hi",
				"reveal": "he"
			},
			{
				"displayText": "tra\u026ad",
				"lexigram": "tra\u026ad",
				"reveal": "tried"
			},
			{
				"displayText": "\u026ag\u02c8z\u00e6ktli",
				"lexigram": "\u026ag\u02c8z\u00e6ktli",
				"reveal": "exactly"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "se\u026am",
				"lexigram": "se\u026am",
				"reveal": "same"
			},
			{
				"displayText": "tr\u026ak",
				"lexigram": "tr\u026ak",
				"reveal": "trick"
			},
			{
				"displayText": "\u0259\u02c8g\u025bn,",
				"lexigram": "\u0259\u02c8g\u025bn",
				"reveal": "again"
			},
			{
				"displayText": "\u00e6nd",
				"lexigram": "\u00e6nd",
				"reveal": "and"
			},
			{
				"displayText": "w\u028cns",
				"lexigram": "w\u028cns",
				"reveal": "once"
			},
			{
				"displayText": "m\u0254r",
				"lexigram": "m\u0254r",
				"reveal": "more"
			},
			{
				"displayText": "hi",
				"lexigram": "hi",
				"reveal": "he"
			},
			{
				"displayText": "w\u028cz",
				"lexigram": "w\u028cz",
				"reveal": "was"
			},
			{
				"displayText": "s\u0259k\u02c8s\u025bsf\u0259l.",
				"lexigram": "s\u0259k\u02c8s\u025bsf\u0259l",
				"reveal": "successful"
			},
			{
				"displayText": "\u02ccha\u028a\u02c8\u025bv\u0259r,",
				"lexigram": "\u02ccha\u028a\u02c8\u025bv\u0259r",
				"reveal": "however"
			},
			{
				"displayText": "n\u0251t",
				"lexigram": "n\u0251t",
				"reveal": "not"
			},
			{
				"displayText": "l\u0254\u014b",
				"lexigram": "l\u0254\u014b",
				"reveal": "long"
			},
			{
				"displayText": "\u02c8\u00e6ft\u0259r,",
				"lexigram": "\u02c8\u00e6ft\u0259r",
				"reveal": "after"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "w\u028alf",
				"lexigram": "w\u028alf",
				"reveal": "wolf"
			},
			{
				"displayText": "\u00f0\u00e6t",
				"lexigram": "\u00f0\u00e6t",
				"reveal": "that"
			},
			{
				"displayText": "h\u00e6d",
				"lexigram": "h\u00e6d",
				"reveal": "had"
			},
			{
				"displayText": "\u02a4\u028cst",
				"lexigram": "\u02a4\u028cst",
				"reveal": "just"
			},
			{
				"displayText": "\u026a\u02c8ske\u026apt",
				"lexigram": "\u026a\u02c8ske\u026apt",
				"reveal": "escaped"
			},
			{
				"displayText": "fr\u028cm",
				"lexigram": "fr\u028cm",
				"reveal": "from"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "zu",
				"lexigram": "zu",
				"reveal": "zoo"
			},
			{
				"displayText": "w\u028cz",
				"lexigram": "w\u028cz",
				"reveal": "was"
			},
			{
				"displayText": "\u02c8l\u028ak\u026a\u014b",
				"lexigram": "\u02c8l\u028ak\u026a\u014b",
				"reveal": "looking"
			},
			{
				"displayText": "f\u0254r",
				"lexigram": "f\u0254r",
				"reveal": "for"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "\u02a7e\u026an\u02a4",
				"lexigram": "\u02a7e\u026an\u02a4",
				"reveal": "change"
			},
			{
				"displayText": "fr\u028cm",
				"lexigram": "fr\u028cm",
				"reveal": "from"
			},
			{
				"displayText": "\u026ats",
				"lexigram": "\u026ats",
				"reveal": "its"
			},
			{
				"displayText": "\u02c8ju\u0292\u0259w\u0259l",
				"lexigram": "\u02c8ju\u0292\u0259w\u0259l",
				"reveal": "usual"
			},
			{
				"displayText": "\u02c8da\u026a\u0259t",
				"lexigram": "\u02c8da\u026a\u0259t",
				"reveal": "diet"
			},
			{
				"displayText": "\u028cv",
				"lexigram": "\u028cv",
				"reveal": "of"
			},
			{
				"displayText": "\u02c8\u02a7\u026ak\u0259n",
				"lexigram": "\u02c8\u02a7\u026ak\u0259n",
				"reveal": "chicken"
			},
			{
				"displayText": "\u00e6nd",
				"lexigram": "\u00e6nd",
				"reveal": "and"
			},
			{
				"displayText": "d\u028ck.",
				"lexigram": "d\u028ck",
				"reveal": "duck"
			},
			{
				"displayText": "so\u028a,",
				"lexigram": "so\u028a",
				"reveal": "so"
			},
			{
				"displayText": "\u02c8o\u028av\u0259r\u02cck\u028cm\u026a\u014b",
				"lexigram": "\u02c8o\u028av\u0259r\u02cck\u028cm\u026a\u014b",
				"reveal": "overcoming"
			},
			{
				"displayText": "\u026ats",
				"lexigram": "\u026ats",
				"reveal": "its"
			},
			{
				"displayText": "f\u026ar",
				"lexigram": "f\u026ar",
				"reveal": "fear"
			},
			{
				"displayText": "\u028cv",
				"lexigram": "\u028cv",
				"reveal": "of"
			},
			{
				"displayText": "\u02c8bi\u026a\u014b",
				"lexigram": "\u02c8bi\u026a\u014b",
				"reveal": "being"
			},
			{
				"displayText": "\u0283\u0251t,",
				"lexigram": "\u0283\u0251t",
				"reveal": "shot"
			},
			{
				"displayText": "\u026at",
				"lexigram": "\u026at",
				"reveal": "it"
			},
			{
				"displayText": "\u02c8\u00e6k\u02a7u\u0259li",
				"lexigram": "\u02c8\u00e6k\u02a7u\u0259li",
				"reveal": "actually"
			},
			{
				"displayText": "d\u026ad",
				"lexigram": "d\u026ad",
				"reveal": "did"
			},
			{
				"displayText": "k\u028cm",
				"lexigram": "k\u028cm",
				"reveal": "come"
			},
			{
				"displayText": "a\u028at",
				"lexigram": "a\u028at",
				"reveal": "out"
			},
			{
				"displayText": "fr\u028cm",
				"lexigram": "fr\u028cm",
				"reveal": "from"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "\u02c8f\u0254r\u0259st",
				"lexigram": "\u02c8f\u0254r\u0259st",
				"reveal": "forest"
			},
			{
				"displayText": "\u00e6nd",
				"lexigram": "\u00e6nd",
				"reveal": "and"
			},
			{
				"displayText": "b\u026a\u02c8g\u00e6n",
				"lexigram": "b\u026a\u02c8g\u00e6n",
				"reveal": "began"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "to"
			},
			{
				"displayText": "\u02c8\u03b8r\u025bt\u0259n",
				"lexigram": "\u02c8\u03b8r\u025bt\u0259n",
				"reveal": "threaten"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "\u0283ip.",
				"lexigram": "\u0283ip",
				"reveal": "sheep"
			},
			{
				"displayText": "\u02c8re\u026as\u026a\u014b",
				"lexigram": "\u02c8re\u026as\u026a\u014b",
				"reveal": "racing"
			},
			{
				"displayText": "da\u028an",
				"lexigram": "da\u028an",
				"reveal": "down"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "to"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "\u02c8v\u026al\u0259\u02a4,",
				"lexigram": "\u02c8v\u026al\u0259\u02a4",
				"reveal": "village"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "b\u0254\u026a",
				"lexigram": "b\u0254\u026a",
				"reveal": "boy"
			},
			{
				"displayText": "\u028cv",
				"lexigram": "\u028cv",
				"reveal": "of"
			},
			{
				"displayText": "k\u0254rs",
				"lexigram": "k\u0254rs",
				"reveal": "course"
			},
			{
				"displayText": "kra\u026ad",
				"lexigram": "kra\u026ad",
				"reveal": "cried"
			},
			{
				"displayText": "a\u028at",
				"lexigram": "a\u028at",
				"reveal": "out"
			},
			{
				"displayText": "\u02c8iv\u026an",
				"lexigram": "\u02c8iv\u026an",
				"reveal": "even"
			},
			{
				"displayText": "\u02c8la\u028ad\u0259r",
				"lexigram": "\u02c8la\u028ad\u0259r",
				"reveal": "louder"
			},
			{
				"displayText": "\u00f0\u00e6n",
				"lexigram": "\u00f0\u00e6n",
				"reveal": "than"
			},
			{
				"displayText": "b\u026a\u02c8f\u0254r.",
				"lexigram": "b\u026a\u02c8f\u0254r",
				"reveal": "before"
			},
			{
				"displayText": "\u0259n\u02c8f\u0254r\u02a7\u0259n\u0259tli,",
				"lexigram": "\u0259n\u02c8f\u0254r\u02a7\u0259n\u0259tli,",
				"reveal": "Unfortunately,"
			},
			{
				"displayText": "\u00e6z",
				"lexigram": "\u00e6z",
				"reveal": "as"
			},
			{
				"displayText": "\u0254l",
				"lexigram": "\u0254l",
				"reveal": "all"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "\u02c8v\u026al\u026a\u02a4\u0259rz",
				"lexigram": "\u02c8v\u026al\u026a\u02a4\u0259rz",
				"reveal": "villagers"
			},
			{
				"displayText": "w\u025cr",
				"lexigram": "w\u025cr",
				"reveal": "were"
			},
			{
				"displayText": "k\u0259n\u02c8v\u026anst",
				"lexigram": "k\u0259n\u02c8v\u026anst",
				"reveal": "convinced"
			},
			{
				"displayText": "\u00f0\u00e6t",
				"lexigram": "\u00f0\u00e6t",
				"reveal": "that"
			},
			{
				"displayText": "hi",
				"lexigram": "hi",
				"reveal": "he"
			},
			{
				"displayText": "w\u028cz",
				"lexigram": "w\u028cz",
				"reveal": "was"
			},
			{
				"displayText": "\u02c8tra\u026a\u026a\u014b",
				"lexigram": "\u02c8tra\u026a\u026a\u014b",
				"reveal": "trying"
			},
			{
				"displayText": "tu",
				"lexigram": "tu",
				"reveal": "to"
			},
			{
				"displayText": "ful",
				"lexigram": "ful",
				"reveal": "fool"
			},
			{
				"displayText": "\u00f0\u025bm",
				"lexigram": "\u00f0\u025bm",
				"reveal": "them"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "\u03b8\u025crd",
				"lexigram": "\u03b8\u025crd",
				"reveal": "third"
			},
			{
				"displayText": "ta\u026am,",
				"lexigram": "ta\u026am",
				"reveal": "time"
			},
			{
				"displayText": "\u00f0e\u026a",
				"lexigram": "\u00f0e\u026a",
				"reveal": "they"
			},
			{
				"displayText": "to\u028ald",
				"lexigram": "to\u028ald",
				"reveal": "told"
			},
			{
				"displayText": "h\u026am,",
				"lexigram": "h\u026am",
				"reveal": "him"
			},
			{
				"displayText": "\u201cgo\u028a",
				"lexigram": "go\u028a",
				"reveal": "go"
			},
			{
				"displayText": "\u0259\u02c8we\u026a",
				"lexigram": "\u0259\u02c8we\u026a",
				"reveal": "away"
			},
			{
				"displayText": "\u00e6nd",
				"lexigram": "\u00e6nd",
				"reveal": "and"
			},
			{
				"displayText": "do\u028ant",
				"lexigram": "do\u028ant",
				"reveal": "don\u2019t"
			},
			{
				"displayText": "\u02c8b\u0251\u00f0\u0259r",
				"lexigram": "\u02c8b\u0251\u00f0\u0259r",
				"reveal": "bother"
			},
			{
				"displayText": "\u028cs",
				"lexigram": "\u028cs",
				"reveal": "us"
			},
			{
				"displayText": "\u0259\u02c8g\u025bn.\u201d",
				"lexigram": "\u0259\u02c8g\u025bn",
				"reveal": "again"
			},
			{
				"displayText": "\u00e6nd",
				"lexigram": "\u00e6nd",
				"reveal": "and"
			},
			{
				"displayText": "so\u028a",
				"lexigram": "so\u028a",
				"reveal": "so"
			},
			{
				"displayText": "\u00f0\u0259",
				"lexigram": "\u00f0\u0259",
				"reveal": "the"
			},
			{
				"displayText": "w\u028alf",
				"lexigram": "w\u028alf",
				"reveal": "wolf"
			},
			{
				"displayText": "h\u00e6d",
				"lexigram": "h\u00e6d",
				"reveal": "had"
			},
			{
				"displayText": "\u0259",
				"lexigram": "\u0259",
				"reveal": "a"
			},
			{
				"displayText": "fist.",
				"lexigram": "fist",
				"reveal": "feast"
			}
		]
	],
	"phonemes": {
		"\u026a": { // ɪ
			"sound": "sounds like i in",
			"asIn": ["his", "in", "himself", "little", "fist", "village", "him", "with", "this", "trick", "its", "chicken", "did"]
		},
		"\u0259": { // ə
			"sound": "sounds like e in",
			"asIn": ["the", "forest", "afternoon", "concern", "later", "after", "diet", "chicken", "louder", "bother"]
		},
		"t": {
			"sound": "sounds like t in",
			"asIn": ["to", "get", "fist", "short", "tried", "trick", "not", "just", "diet", "shot", "it", "out", "trying", "time", "told", "don\u2019t", "feast"]
		},
		"r": {
			"sound": "sounds like r in",
			"asIn": ["poor", "near", "for", "raising", "air", "ran", "rushed", "later", "however", "after", "fear", "racing", "louder", "bother"]
		},
		"n": {
			"sound": "sounds like n in",
			"asIn": ["in", "next", "near", "plan", "fun", "ran", "down", "soon", "even", "again", "not", "chicken", "began", "threaten", "than"]
		},
		"s": {
			"sound": "sounds like s in",
			"asIn": ["flocks", "some", "soon", "safety", "stayed", "this", "so", "same", "its", "us"]
		},
		"f": {
			"sound": "sounds like f in",
			"asIn": ["flocks", "fields", "forest", "foot", "for", "himself", "fun", "fist", "wolf", "from", "full", "few", "fear", "fool", "feast"]
		},
		"l": {
			"sound": "sounds like l in",
			"asIn": ["all", "full", "later", "successful", "long", "looking", "usual", "louder", "fool"]
		},
		"d": {
			"sound": "sounds like d in",
			"asIn": ["shepherd", "used", "dark", "good", "and", "down", "heard", "stayed", "days", "tried", "had", "diet", "duck", "did", "cried", "told", "don\u2019t"]
		},
		"\u028c": { // ʌ
			"sound": "sounds like u in",
			"asIn": ["up", "fun", "much", "just", "duck", "us"]
		},
		"\u00f0": { // ð
			"sound": "sounds like th in",
			"asIn": ["there", "the", "they", "this", "that", "than", "them", "bother"]
		},
		"\u028a": { // ʊ
			"sound": "sounds like oo in",
			"asIn": ["foot", "good", "looking"]
		},
		"\u00e6": { // æ
			"sound": "sounds like a in",
			"asIn": ["plan", "and", "have", "ran", "as", "that", "exactly", "after", "had", "began", "than"]
		},
		"z": {
			"sound": "sounds like s in",
			"asIn": ["was", "used", "his", "fields", "raising", "as", "homes", "cousins", "days"]
		},
		"h": {
			"sound": "sounds like h in",
			"asIn": ["his", "hot", "he", "himself", "have", "heard", "him", "homes", "however", "had"]
		},
		"\u0254": { // ɔ
			"sound": "sounds like o in",
			"asIn": ["boy", "forest", "for", "short", "more", "long", "before"]
		},
		"k": {
			"sound": "sounds like c in",
			"asIn": ["company", "cousins", "escaped", "come", "course", "cried", "convinced"]
		},
		"m": {
			"sound": "sounds like m in",
			"asIn": ["mountain", "him", "from", "much", "more", "them"]
		},
		"u": {
			"sound": "sounds like o in",
			"asIn": ["who", "to", "soon", "zoo", "fool"]
		},
		"w": {
			"sound": "sounds like w in",
			"asIn": ["was", "watch", "wolf", "with", "while", "were"]
		},
		"i": {
			"sound": "sounds like e in",
			"asIn": ["he", "being", "sheep", "feast"]
		},
		"v": {
			"sound": "sounds like v in",
			"asIn": ["have", "village", "even", "gave"]
		},
		"\u025b": { // ɛ
			"sound": "sounds like e in",
			"asIn": ["next", "get", "himself", "them"]
		},
		"a": {
			"sound": "sounds like o in",
			"asIn": ["down", "shouting", "however", "out", "louder"]
		},
		"e": {
			"sound": "sounds like a in",
			"asIn": ["raising", "safety", "stayed", "gave", "days", "later", "same", "change", "racing"]
		},
		"o": {
			"sound": "sounds like o in",
			"asIn": ["also", "homes", "so", "told", "go", "don\u2019t"]
		},
		"p": {
			"sound": "sounds like p in",
			"asIn": ["poor", "up", "plan", "pleasure", "sheep"]
		},
		"g": {
			"sound": "sounds like g in",
			"asIn": ["good", "get", "gave", "go"]
		},
		"\u014b": { // ŋ
			"sound": "sounds like ng in",
			"asIn": ["raising", "shouting", "long", "looking", "overcoming", "being", "racing", "trying"]
		},
		"b": {
			"sound": "sounds like b in",
			"asIn": ["boy", "being", "began", "before", "bother"]
		},
		"\u0251": { // ɑ
			"sound": "sounds like o in",
			"asIn": ["flocks", "hot", "not", "shot", "bother"]
		},
		"\u0283": { // ʃ
			"sound": "sounds like sh in",
			"asIn": ["shepherd", "shouting", "rushed", "short", "shot", "sheep"]
		},
		"\u02a7": { // ʧ
			"sound": "sounds like ch in",
			"asIn": ["watch", "much", "change", "chicken"]
		},
		"\u02a4": { // ʤ
			"sound": "sounds like g in",
			"asIn": ["village", "change"]
		},
		"\u025c": { // ɜ
			"sound": "sounds like e in",
			"asIn": ["heard", "concern"]
		},
		"j": {
			"sound": "sounds like u in",
			"asIn": ["used", "usual"]
		},
		"\u03b8": { // θ
			"sound": "sounds like th in",
			"asIn": ["thought", "threaten", "third"]
		},
		"\u0292": { // ʒ
			"sound": "sounds like s in",
			"asIn": ["pleasure", "usual"]
		}
	}
}
