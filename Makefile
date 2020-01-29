build:
	NODE_ENV=production /usr/bin/node \
		--max_old_space_size=150 \
		--max_semi_space_size=1 \
		./node_modules/babel-cli/bin/babel src -d dist --copy-files --ignore '**/*.test.js'

deps:
	NODE_ENV=production /usr/bin/node \
		--max_old_space_size=150 \
		--max_semi_space_size=1 \
		/usr/bin/npm install
