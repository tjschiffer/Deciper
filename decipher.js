/*
Assumptions:
	- The text is a sentence
	- The words in the sentence are in place, separated by spaces
	- Words are relatively common, English words. Two and three letter words are probably very common words.
	- Each character maps to another character in the alphabet
	- Each character mapping is unique (e.g. if a -> b no other letter can map to b)
*/

var fs = require('fs'), validWords = require('./Words.json'), wordFreq = require('./WordFrequency.json'), phraseFreq = require('./PhraseFrequency.json');

// function assert(boo) {
// 	if (!boo) {
// 		throw Error();
// 	}
// }

function unique(arr) {
	var inArray = {};
	return arr.filter(function(item) {
		return inArray.hasOwnProperty(item) ? false : (inArray[item] = true);
	});
}

function removeElement(arr, element) {
	while ((idx = arr.indexOf(element)) !== -1) {
		arr.splice(idx, 1);
	}
	return arr;
}

alphabet = 'etaoinshrdlcumwfgypbvkjxqz'.split(''); // Letters in order of frequency in English
// alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

var text = fs.readFileSync('text.txt').toString(),
	words = text.split(' ');

var resultArr = [];

words.sort(function(a, b) {
	return a.length > b.length ? 1 : -1
});
letters = unique(words.join('').split(''));
var letterMapping = {};
letters.forEach(function(letter) {
	letterMapping[letter] = null;
});

for(var i = 0, l = words.length; i<l; i++) {
	var len_word = words[i].length, word = '';
	while(len_word--) {
		word += '*';
	}
	resultArr.push(word);
}

function returnWordScore(word, lettersLeft){
	function wordFreqCalc(word) {
		wordScoreVal = 2;
		if (wordFreq[word]) {
			wordScoreVal *= wordFreq[word];
		}
		return wordScoreVal;
	}

	var wordsOfLength = validWords[word.length];
	if (!wordsOfLength) return 0.2;
	var l = wordsOfLength.length,
		regex = (word.indexOf('*') > -1),
		wL = word.length;
	if (regex) {
		for(var i = 0; i<l; i++) {
			var item = wordsOfLength[i];
			var match = true;
			for(var j = 0; j < wL; j++) {
				if ((word[j] != '*' && word[j] != item[j]) || (word[j] == '*' && lettersLeft.indexOf(word[j]) > -1)) {
					match = false;
					break;					
				}
			}
			if (match) return 1;
		}
	} else {
		if (wordFreq[word]) {
			return wordFreqCalc(word);
		} 
		if (word.length < 3) return 0.2;
		if (wordsOfLength.indexOf(word) > -1) return 1;
		if (lettersLeft.length == 0) {
			// check media wiki
		}
	}
	return 0.5;
}

//console.assert(returnWordScore('qx', letters) == 0);
// assert(returnWordScore('taqx*', letters) == 1);
// assert(returnWordScore('*ot', letters) == 2);
// assert(returnWordScore('tas*', letters) == 2);
// assert(returnWordScore('**', letters) == 2);
// assert(returnWordScore('party', letters) > 2);

function returnPhraseScore(result){
	var phraseScore = 1, words = result.split(' '), numPhrase = 0, numFreqPhrase = 0;
	for(var i = 0, l = words.length-1; i<l;i++){
		var word = words[i], nextWord = words[i+1];
		if (word.indexOf('*') == -1 && nextWord.indexOf('*') == -1) {
			numPhrase++;
			var phrase = word + ' ' + nextWord;
			// console.log(phrase);
			if (phraseFreq[phrase]) {
				numFreqPhrase++;
				phraseScore *= phraseFreq[phrase];
			}
		}
	}
	if (numPhrase > 2 && numPhrase > numFreqPhrase*3) return 0;
	return phraseScore;
}

//console.log(returnPhraseScore('to be or not to'));
//process.exit();

function returnResultScore(result, lettersLeft){
	var wordScore = 0,
		wordCount = 0,
		resultArr = result.split(' ');
	for (var i = 0, l = resultArr.length; i<l; i++) {
		var word = resultArr[i], wordScoreWord = returnWordScore(word, lettersLeft);
		//if (word.length < 3 && wordScoreWord < 1) return 0;
		if (wordScoreWord) {
			wordCount += wordScoreWord >= 1 ? 1 : 0;
			wordScore += wordScoreWord;
		}
	};
	if (wordCount < resultArr.length*15/16) return 0;

	var phraseScore = returnPhraseScore(result);

	//console.log(wordCount, resultArr.length*15/16, wordScore, phraseScore, result);

	return wordScore*phraseScore;
}

function sFact(num){
    var rval=1;
    for (var i = 2; i <= num; i++)
        rval = rval * i;
    return rval;
}

possibleKeys = [];

var depth = 0, 
	stack = [{aphsLeft: alphabet.slice(), letterMap:{}, lettersLeft: letters.slice(), score: 1, result:''}];
while (stack.length) {
	var k = stack.length;

	if (Object.keys(stack[0].letterMap).length > 2) {
		stack.sort(function(a,b){
			return b.score - a.score > 0 ? 1 : -1;
		});
	}
	// printStack(stack);
	current = stack.shift();
	console.log(k, current.result, current.letterMap, current.lettersLeft.join(''), current.aphsLeft.join(''), current.score);

	if (Object.keys(current.letterMap).length == letters.length) {
		// console.log(current.resultArr);
		// resultArrs.push(current.resultArr.join(''));
		console.log(current.result);
		possibleKeys.push({'map':current.letterMap, 'score':current.score, 'result':current.result});
		//break;
		//if (possibleKeys.length > 0) break;
	} else {
		current.aphsLeft.forEach(function(aphLeft){
			var aphLeft = aphLeft; //current.aphLeft[0],
				aphsLeft = current.aphsLeft.slice(1),
				letter = current.lettersLeft[0],
				lettersLeft = current.lettersLeft.slice(1),
				letterMap = Object.assign({}, current.letterMap);
			letterMap[letter] = aphLeft;
			var result = decipherText(letterMap),
				score = returnResultScore(result, lettersLeft, score);
			//console.log(letter, k, result, lettersLeft.join(''), score);
			if (score > 0) {
				stack.push({aphsLeft: aphsLeft, letterMap: letterMap, lettersLeft: lettersLeft, resultArr: resultArr.slice(), score:score, result:result});
			}
			current.aphsLeft = aphsLeft.concat(aphLeft);
			// current.lettersLeft = lettersLeft.concat(letter);
		});
	}
	depth++;
}

// console.log(possibleKeys);
function decipherText(key){
	result = '';
	for(var i = 0, l = text.length; i<l; i++){
		if (text[i] == ' ') {
			result += ' ';
		} else {
			var letter = key[text[i]];
			result += letter || '*';
		}
	}
	return result;
}

// function printStack(stack) {
// 	console.log('\x1Bc');
// 	stack.forEach(function(current){
// 		console.log(current.result);
// 	})
// }

possibleKeys.sort(function(a, b){
	return b.score - a.score > 0 ? 1 : -1;
});

possibleKeys.forEach(function(key){
	console.log(key.result, key.score);
});
console.log(possibleKeys.length);
// console.log(results.length);
// console.log(unique(results).length);