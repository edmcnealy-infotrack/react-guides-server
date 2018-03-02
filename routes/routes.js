const router = require('express').Router();
const docsController = require('./docsController');
const guidesRouteController = require('./guidesRouteController');

router.route('/docs').get(docsController.get);
router.route('/guides/*').get(guidesRouteController.get);

module.exports = router;