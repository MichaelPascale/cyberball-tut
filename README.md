# cyberball-tut

This project is a clone of the [Cyberball](http://www3.psych.purdue.edu/~willia55/Announce/cyberball.htm) task (Williams et al., 2000). It has been rewritten in modern JavaScript and adds several new features including thought probes to measure [task-unrelated thought](https://en.wikipedia.org/wiki/Mind-wandering) (TUT) during the task.

The main configuration file is `options.json`. This file holds settings applicable to all conditions such as the Qualtrics URL to redirect to when the task is completed. Each condition may be further configured with a numbered `json` file in the `conditions/` directory. A wide range of variables may be manipulated including the number of confederates, the probability of each player recieving the ball, the time intervals between mind wandering (MW) probes, and the length of the task. All interface text is customizable with `strings.json`.

The experimental condition number and unique participant identifier must be passed in the URL query string (e.g. `https://cyberball.example.com?condition=2&id=7228260153`).

Upon completion of the task, a `POST` request containing JSON data is sent to the configured server. This includes a timestamped record of each throw and each MW probe response.

---
Copyright &copy; 2020, Michael Pascale. [MIT Licensed](https://mit-license.org/).

Image assets and concept have been borrowed from the original program. This project is dependent on [jQuery](https://jquery.com/).