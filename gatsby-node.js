const path = require(`path`)
const _ = require("lodash")
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const categoryTemplate = path.resolve(`./src/templates/category-page.js`)
  const tagTemplate = path.resolve(`./src/templates/tags-page.js`)

  return graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
                description
                tags
                categories
              }
            }
          }
        }
      }
    `
  ).then(result => {
    if (result.errors) {
      throw result.errors
    }

    // Create blog posts pages.
    const posts = result.data.allMarkdownRemark.edges

    posts.forEach((post, index) => {
      const previous = index === posts.length - 1 ? null : posts[index + 1].node
      const next = index === 0 ? null : posts[index - 1].node

      createPage({
        path: post.node.fields.slug,
        component: blogPost,
        context: {
          slug: post.node.fields.slug,
          previous,
          next,
        },
      })
    })

    // Make category pages
    let categories = []
    // Iterate through each post
    _.each(posts, edge => {
      if (_.get(edge, "node.frontmatter.categories")) {
        categories = categories.concat(edge.node.frontmatter.categories)
      }
    })
    // dedupe
    categories = _.uniq(categories)

    // Make the category pages
    categories.forEach(category => {
      createPage({
        path: `/categories/${_.kebabCase(category)}`,
        component: categoryTemplate,
        context: {
          category,
        },
      })
    })

    // Make tag pages
    let tags = []
    // Iterate through each post
    _.each(posts, edge => {
      if (_.get(edge, "node.frontmatter.tags")) {
        tags = tags.concat(edge.node.frontmatter.tags)
      }
    })
    // dedupe
    tags = _.uniq(tags)

    // Make the tag pages
    tags.forEach(tag => {
      createPage({
        path: `/tags/${_.kebabCase(tag)}`,
        component: tagTemplate,
        context: {
          tag,
        },
      })
    })


    return null
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode }).replace(/\d{8}--/, '')
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
