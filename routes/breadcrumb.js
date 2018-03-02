const base = 'Guides';

module.exports = {
	create: (req, res) => {
		let breadcrumbs = [];
		// Remove any leading and trailing /'s
		let requestPath = req.path.replace(/\/\s*$/, '');

		let paths = requestPath.split('/');
		paths.shift();	// Remove the first (it's blank)
		// paths[0] = '';	// Hack specific to the guides routes... might break other routes

		let path = '';
		for (let i = 0; i < paths.length; i++) {
			// Probably a better way to do this, but the second one should not have another / appended, since the first is already a /, so that would make the second one //url, which would break everything
			let text;
			if (i === 0) {
				text = base;
			} else {
				text = paths[i];
				path += '/' + paths[i];
			}

			path.replace(/\s/g, '-');	// Format the url
			text = text;
			let crumb = {
				text: text,
				url: path
			}
			breadcrumbs.push(crumb)
		}
		res.locals.breadcrumbs = breadcrumbs;
		return breadcrumbs;
	},
	// Create a single breadcrumb, so it would be Guides / title
	createSingle: (res, title) => {
		let breadcrumbs = [];
		// The second one doesn't need a url
		breadcrumbs.push({
			text: base,
			url: '/'
		}, {
			text: title
		});
		res.locals.breadcrumbs = breadcrumbs;
		return breadcrumbs;
	}
}