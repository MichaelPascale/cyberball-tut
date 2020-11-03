# cyberball-tut

This project is a clone of the [Cyberball](http://www3.psych.purdue.edu/~willia55/Announce/cyberball.htm) task (Williams et al., 2000). It has been rewritten in modern JavaScript and adds several new features including thought probes to measure [task-unrelated thought](https://en.wikipedia.org/wiki/Mind-wandering) (TUT) during the task.

___

## Configuration

The main configuration file is `options.json`. This file holds settings applicable to all conditions such as the Qualtrics URL to redirect to when the task is completed as well as the parameters to each individual condition. A wide range of variables may be manipulated including the number of confederates, the probability of each player recieving the ball, the time intervals between mind wandering (MW) probes, and the length of the task. All interface text is customizable with `strings.json`.

The experimental condition number and unique participant identifier must be passed from Qualtrics in the URL query string (e.g. `https://cyberball.example.com?condition=2&linkid=7228260153`). If the condition is not randomly assigned by Qualtrics, it will be randomly assigned at the start of the game. Similarly, if no participant ID is passed into Cyberball, a random eight digit ID will be generated. These same parameters will be passed back to Qualtrics at the end of the game along with `completed=true`. The query string may be [recieved by Qualtrics as embedded data](https://www.qualtrics.com/support/survey-platform/survey-module/survey-flow/standard-elements/passing-information-through-query-strings/#PassingInformationIntoASurvey).

Upon completion of the task, a `POST` request containing JSON data is sent to the configured server. This includes a timestamped record of each throw and each MW probe response.

---

## Notes

This implementation of Cyberball uses the _overall_ probability of each player recieving the ball. Because the probability of a throw to each player is dependent on the last throw, the system is a [Markov process](https://en.wikipedia.org/wiki/Markov_chain). The input constants are binomials of the probabilities of independent throws from each player and so they will not be equal to the probability to be achieved. For example, if the participant is to recieve the ball at an overall rate of `0.15` in a 3 player game, the independent probability of any throw going to the participant must be `0.1765` and the parameter to the game will be `0.0968`.

---

Copyright &copy; 2020, Michael Pascale. [MIT Licensed](https://mit-license.org/).

Image assets and concept have been borrowed from the original program. This project is dependent on [jQuery](https://jquery.com/).