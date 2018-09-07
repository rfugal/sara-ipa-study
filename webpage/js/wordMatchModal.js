// JavaScript Document
// word match modal functions
// Copyright 2018 Russ Fugal

sessionStorage.setItem('studyMethod', 2);

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
			var sound = window.learningContent.phonemes[alpha].sound;
			var asIn = reveal;
			while ( asIn === reveal ) {
				asIn = window.shuffle(window.learningContent.phonemes[alpha].asIn)[0];
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

window.loadImmersiveText = function loadImmersiveText() {
	var studyMethod = parseInt(sessionStorage.getItem('studyMethod'));	
	// cycle interaction methods
	// studyMethod = (studyMethod === 2) ? 0 : studyMethod + 1;
	// sessionStorage.setItem('studyMethod', studyMethod);
	
	$('section').each(function() {
		$( this ).hide();
	}).ready(function(){
		$('div.mainReader').each(function(){
			$( this ).hide();
		}).ready(function(){
			$('#learnImmersiveText').show();
			$('section#learn_screen').show();
            $(window).scrollTop(0);
		});
	});
	$('#modal_wordMatch').on('hide.bs.modal', freezeWordMatchModal);
	$('#modal_immersionInstructions').modal('show');
	$('#learnImmersiveText').html('');
	window.learningRecord.interactions = [];
	var spanIndex = 0;
	$.each( window.learningRecord.paragraphs, function(paragraphIndex, paragraph) {
		var interactionMethod = 'wordMatchSpan';
		interactionMethod = (studyMethod === 0) ? 'phonemeMapSpan' : interactionMethod;
		interactionMethod = (studyMethod === 1) ? 'wordRevealSpan' : interactionMethod;
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
};
window.shuffle = function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
};

var pairs = {"\u025b": "\u00f0", "r": "\u0259", "\u028c": "w", "z": "\u026a", "n": "\u00e6", "s": "\u02c8", "u": "t", "\u0283": "\u02c8", "p": "\u025b", "\u0259": "\u00f0", "d": "n", "\u0254": "f", "\u026a": "e", "\u0251": "w", "\u02a7": "\u0251", "l": "\u028a", "k": "\u02c8", "i": "h", "t": "s", "f": "l", "\u028a": "o", "v": "\u028c", "m": "\u028c", "a": "d", "\u00e6": "\u00f0", "\u02c8": "n", "o": "s", "e": "r", "\u014b": "\u026a", "\u02a4": "\u0259", "\u025c": "h", "\u00f0": "\u026a", "\u0292": "\u025b", "j": "f", "g": "\u02c8", "h": "\u02cc", "w": "\u0259", "\u02cc": "r", "b": "\u02c8", "\u03b8": "\u02c8"};