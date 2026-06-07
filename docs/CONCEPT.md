# JSX Viewer

When working with Claude Code, it generates these beautiful dashboards and other artifacts which are in JSX format. Unfortunately, we can't run them in the browser.

The idea behind this project is to run the necessary boilerplate necessary for rendeering the JSX files in a local environment. The code will run in a docker container with a local website to render the JSX. I should be able to just drag and drop a JSX file onto that site to render it and see it in action.

Bonus: When double clicking the JSX file on MacOS, it should open the link to the local website with the JSX file rendered in it.