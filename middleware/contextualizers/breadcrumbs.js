module.exports = async function breadcrumbs (req, res, next) {
  if (!req.context.page) return next()
  if (req.context.page.hidden) return next()

  req.context.breadcrumbs = []

  // Return an empty array on the landing page.
  if (req.context.page.documentType === 'homepage') {
    return next()
  }

  const currentSiteTree = req.context.siteTree[req.context.currentLanguage][req.context.currentVersion]

  await createBreadcrumb(
    // Array of child pages on the root, i.e., the product level.
    currentSiteTree.childPages,
    req.context
  )

  return next()
}

async function createBreadcrumb (pageArray, context) {
  // Find each page in the siteTree's array of child pages that starts with the requested path.
  const childPage = pageArray.find(page => context.currentPath.startsWith(page.href))

  context.breadcrumbs.push({
    documentType: childPage.page.documentType,
    href: childPage.href,
    title: await childPage.page.renderTitle(context, { textOnly: true, encodeEntities: true })
  })

  // Recursively loop through the siteTree and create each breadcrumb, until we reach the
  // point where the current siteTree page is the same as the requested page. Then stop.
  if (childPage.childPages && context.currentPath !== childPage.href) {
    createBreadcrumb(childPage.childPages, context)
  }
}
