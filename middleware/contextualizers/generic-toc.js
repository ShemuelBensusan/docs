const { sortBy } = require('lodash')

module.exports = async function genericToc (req, res, next) {
  if (!req.context.page) return next()
  if (req.context.page.hidden) return next()
  if (req.context.currentLayoutName !== 'generic-toc') return next()

  const currentSiteTree = req.context.siteTree[req.context.currentLanguage][req.context.currentVersion]

  // Find the array of child pages that start with the requested path.
  const currentPageInSiteTree = findPageInSiteTree(currentSiteTree.childPages, req.context.currentPath)

  const unsortedTocItems = await Promise.all(currentPageInSiteTree.childPages.map(async (childPage) => {
    // return an empty string if it's a hidden link on a non-hidden page (hidden links on hidden pages are OK)
    if (childPage.page.hidden && !req.context.page.hidden) {
      return ''
    }

    const fullPath = childPage.href
    const title = await childPage.page.renderTitle(req.context, { textOnly: true, encodeEntities: true })
    const intro = await childPage.page.renderProp('intro', req.context, { unwrap: true })

    return { fullPath, title, intro }
  }))

  req.context.tocItems = sortBy(
    unsortedTocItems,
    // Sort by the ordered array of `children` in the frontmatter.
    currentPageInSiteTree.page.children
  )

  return next()
}

// Recursively loop through the siteTree until we reach the point where the
// current siteTree page is the same as the requested page. Then stop.
function findPageInSiteTree (pageArray, currentPath) {
  const childPage = pageArray.find(page => currentPath.startsWith(page.href))

  if (childPage.href === currentPath) {
    return childPage
  }

  return findPageInSiteTree(childPage.childPages, currentPath)
}
