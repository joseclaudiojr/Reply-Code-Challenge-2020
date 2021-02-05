const fs = require('fs')

/////////////////////////
////Globals
// const filename = 'a_solar.txt';
// const filename = 'b_dream.txt';
// const filename = 'c_soup.txt';
// const filename = 'd_maelstrom.txt';
// const filename = 'e_igloos.txt';
const filename = 'f_glitch.txt';

var map = {};
var devMap = {};
var managerMap = {};
var devSpots = 0;
var managerSpots = 0;

var devCount;
var managerCount;

var companyObj = {};
var companyCount = 0;

var skillsObj = {};
var skillsCount = 0;

var devs = [];
var managers = [];

var wpCalcCache = {};

var skillsHashObj = {};
var skillsHashCount = 0;
/////////////////////////


/////////////////////////
function main() {
  readFile();

  //
  spreadSolve();

  var solutionScore = calcSolutionScore();
}
//Call main function
main();
/////////////////////////

function spreadSolve() {
  /////////////////////////
  //Create the ordered spots for devs and managers
  var orderedDevSpots = [];
  var orderedManagerSpots = [];

  //Add the positions to arrays
  var devsSpotsKeys = Object.keys(devMap);
  var managersSpotsKeys = Object.keys(managerMap);

  ////
  //Calc the initial count for both arrays
  for (var i = 0; i < devsSpotsKeys.length; i++) {
    var mySpotKey = devsSpotsKeys[i];
    orderedDevSpots.push({
      key: mySpotKey,
      score: countSpotIntersections(mySpotKey),
    })
  }

  for (var i = 0; i < managersSpotsKeys.length; i++) {
    var mySpotKey = managersSpotsKeys[i];
    orderedManagerSpots.push({
      key: mySpotKey,
      score: countSpotIntersections(mySpotKey),
    })
  }
  ////
  //Calc local the region for both arrays
  for (var i = 0; i < orderedDevSpots.length; i++) {
    var mySpot = orderedDevSpots[i];

    var mean = calcSpotMeanScore(mySpot.key);
    mySpot.score += mean;
  }
  for (var i = 0; i < orderedManagerSpots.length; i++) {
    var mySpot = orderedManagerSpots[i];

    var mean = calcSpotMeanScore(mySpot.key);
    mySpot.score += mean;
  }


  //Sort the arrays
  // orderedDevSpots = orderedDevSpots.sort((a, b) => { if (a.score < b.score) return 1; else if (a.score > b.score) return -1; else return 0 });
  // orderedManagerSpots = orderedManagerSpots.sort((a, b) => { if (a.score < b.score) return 1; else if (a.score > b.score) return -1; else return 0 });
  orderedDevSpots = orderedDevSpots.sort((a, b) => { return - a.score + b.score });
  orderedManagerSpots = orderedManagerSpots.sort((a, b) => { return - a.score + b.score });
  /////////////////////////


  console.log(orderedDevSpots[0]);
  console.log(orderedDevSpots[orderedDevSpots.length-1]);
  console.log(orderedManagerSpots[0]);
  console.log(orderedManagerSpots[orderedManagerSpots.length-1]);
}

function calcSpotMeanScore(spotKey) {
  var range = 5;
  var foundCount = 0;
  var sum = 0;

  var splitedKey = spotKey.split('_');
  var x = parseInt(splitedKey[0]);
  var y = parseInt(splitedKey[1]);

  for (var i = -range; i <= range; i++) {
    for (var j = -range; j <= range; j++) {
      if (i == 0 && j == 0) continue;

      var mySpotKey = (x + i) + '_' + (y + j);

      if (map.hasOwnProperty(mySpotKey)) {
        foundCount++;
        sum += countSpotIntersections(mySpotKey);
      }
    }
  }

  if (foundCount) {
    return sum / foundCount;
  }

  return sum;
}

/////////////////////////
function calcSolutionScore() {
  var totalScore = 0;

  for (position in map) {
    var rep = map[position];
    var splitPosition = position.split('_');

    var x = parseInt(splitPosition[0]);
    var y = parseInt(splitPosition[1]);

    var topScore = calcWP(rep, map[x + '_' + (y - 1)]);
    var bottomScore = calcWP(rep, map[x + '_' + (y + 1)]);
    var leftScore = calcWP(rep, map[(x - 1) + '_' + y]);
    var rightScore = calcWP(rep, map[(x + 1) + '_' + y]);

    totalScore += topScore + bottomScore + leftScore + rightScore;
  }

  return totalScore / 2;
}
/////////////////////////

/////////////////////////
function countSpotIntersections(spotKey) {
  var intersections = 0;

  var splitedKey = spotKey.split('_');
  var x = parseInt(splitedKey[0]);
  var y = parseInt(splitedKey[1]);

  var topKey = x + '_' + (y - 1);
  var bottomKey = x + '_' + (y + 1);
  var leftKey = (x - 1) + '_' + y;
  var rightKey = (x + 1) + '_' + y;

  if (map.hasOwnProperty(topKey)) intersections++;
  if (map.hasOwnProperty(bottomKey)) intersections++;
  if (map.hasOwnProperty(leftKey)) intersections++;
  if (map.hasOwnProperty(rightKey)) intersections++;

  return intersections;
}
/////////////////////////


/////////////////////////
//Parameters: strings in format d + dev id (example: d10) or m + manager id (example: m5)
//Example call: calcWP('d0', 'm0');
function calcWP(rep1, rep2) {
  if (!rep1 || !rep2) {
    return 0;
  }

  //Check if result exists on cache
  if (wpCalcCache[rep1 + rep2] != null) {
    return wpCalcCache[rep1 + rep2];
  }
  if (wpCalcCache[rep2 + rep1] != null) {
    return wpCalcCache[rep2 + rep1];
  }

  //get reps obj
  var rep1Type = rep1[0];
  var rep1Id = rep1.substr(1, rep1.length - 1);
  var rep1Obj;
  if (rep1Type == 'd') {
    rep1Obj = devs[rep1Id];
  }
  else {
    rep1Obj = managers[rep1Id];
  }

  var rep2Type = rep2[0];
  var rep2Id = rep2.substr(1, rep2.length - 1);
  var rep2Obj;
  if (rep2Type == 'd') {
    rep2Obj = devs[rep2Id];
  }
  else {
    rep2Obj = managers[rep2Id];
  }

  /////////////////////
  //Calc bonus potential
  var bp = 0;
  if (rep1Obj.company == rep2Obj.company) {
    bp = rep1Obj.bonus * rep2Obj.bonus;
  }

  //Calc devs WP
  var wp = 0;
  if (rep1Type == 'd' && rep2Type == 'd') {
    var totalSkills = 0;
    var commonSkills = 0;
    var skillsControllObj = {};

    for (skillId in rep1Obj.skills) {
      skillsControllObj[skillId] = true;
      totalSkills++;
    }

    for (skillId in rep2Obj.skills) {
      if (skillsControllObj[skillId]) {
        commonSkills++;
      }
      else {
        skillsControllObj[skillId] = true;
        totalSkills++;
      }
    }

    var diffSkills = totalSkills - commonSkills;

    wp = diffSkills * commonSkills;
  }

  var score = bp + wp;

  //Set value to cache
  wpCalcCache[rep1 + rep2] = score;
  wpCalcCache[rep2 + rep1] = score;

  return score;
}
/////////////////////////

/////////////////////////
function readFile() {
  console.log("- Starting reading file.\n");
  var initTime = Date.now();

  var data = fs.readFileSync('inputs/' + filename, 'utf8');

  var rows = data.split('\n');
  var firstRow = rows[0].split(' ');

  var colsCount = parseInt(firstRow[0]);
  var linesCount = parseInt(firstRow[1]);

  /////////////////////////
  //Read map lines
  for (var i = 0; i < linesCount; i++) {
    var myRow = rows[1 + i];

    //Read map cols
    for (var j = 0; j < colsCount; j++) {
      var myCol = myRow[j];

      //Dev spot
      if (myCol == '_') {

        devSpots++;
        map[j + '_' + i] = '';
        devMap[j + '_' + i] = '';
      }

      //Manager spot
      else if (myCol == 'M') {
        managerSpots++;
        map[j + '_' + i] = '';
        managerMap[j + '_' + i] = '';
      }
    }
  }
  /////////////////////////

  /////////////////////////
  //Read devs
  devCount = parseInt(rows[linesCount + 1]);

  for (var i = 0; i < devCount; i++) {
    var myDev = rows[linesCount + 2 + i].split(' ');

    var companyName = myDev[0];

    if (companyObj[companyName] == null) {
      companyObj[companyName] = {
        id: companyCount,
        devs: 0,
        managers: 0,
      };
      companyCount++;
    }

    companyObj[companyName].devs++;

    //Build skils obj
    var mySkillsCount = parseInt(myDev[2]);
    var mySkillsObj = {};

    for (var j = 0; j < mySkillsCount; j++) {
      var mySkillName = myDev[3 + j];

      if (skillsObj[mySkillName] == null) {
        skillsObj[mySkillName] = skillsCount;
        skillsCount++;
      }

      mySkillsObj[skillsObj[mySkillName]] = true;
    }

    var hash = (Object.keys(mySkillsObj).sort((a, b) => {
      var int1 = parseInt(a);
      var int2 = parseInt(b);
      return int1 > int2;
    })).join('_');

    if (skillsHashObj[hash] == null) {
      skillsHashObj[hash] = true;
      skillsHashCount++;
    }

    var devObj = {
      company: companyObj[companyName].id,
      bonus: parseInt(myDev[1]),
      skills: mySkillsObj,
      skillsHash: hash,
    }

    devs.push(devObj);
  }
  /////////////////////////

  /////////////////////////
  //Read managers
  managerCount = parseInt(rows[linesCount + devCount + 2]);

  for (var i = 0; i < managerCount; i++) {
    var myManager = rows[linesCount + devCount + 3 + i].split(' ');

    var companyName = myManager[0];

    if (companyObj[companyName] == null) {
      companyObj[companyName] = {
        id: companyCount,
        devs: 0,
        managers: 0,
      };
      companyCount++;
    }

    companyObj[companyName].managers++;

    var managerObj = {
      company: companyObj[companyName].id,
      bonus: myManager[1],
    }

    managers.push(managerObj)
  }
  /////////////////////////

  //Remote last increment
  companyCount--;
  skillsCount--;

  //Finishing reading
  var endTime = Date.now();
  //Print stats
  console.log("-- Finished reading file in " + ((endTime - initTime) / 1000) + " seconds.");
  console.log("--- devSpots: " + devSpots);
  console.log("--- managerSpots: " + managerSpots);
  console.log("--- devCount: " + devCount);
  console.log("--- managerCount: " + managerCount);
  console.log("--- companyCount: " + companyCount);
  console.log("--- skillsCount: " + skillsCount);
  console.log("--- skillsHashCount: " + skillsHashCount + '\n');
}
/////////////////////////