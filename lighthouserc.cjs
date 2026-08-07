module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,

      staticDistDir: "./dist/client",

      url: [
        "http://localhost/",
        "http://localhost/projects",
        "http://localhost/blog",
        "http://localhost/blog/astro-learning-notes",
      ],
    },

    assert: {
      assertions: {
        "categories:performance": [
          "error",
          {
            minScore: 0.9,
            aggregationMethod: "median",
          },
        ],

        "categories:accessibility": [
          "error",
          {
            minScore: 0.95,
            aggregationMethod: "median",
          },
        ],

        "categories:best-practices": [
          "error",
          {
            minScore: 0.95,
            aggregationMethod: "median",
          },
        ],

        "categories:seo": [
          "error",
          {
            minScore: 0.95,
            aggregationMethod: "median",
          },
        ],

        "first-contentful-paint": [
          "error",
          {
            maxNumericValue: 2000,
            aggregationMethod: "median",
          },
        ],

        "largest-contentful-paint": [
          "error",
          {
            maxNumericValue: 2500,
            aggregationMethod: "median",
          },
        ],

        "total-blocking-time": [
          "error",
          {
            maxNumericValue: 300,
            aggregationMethod: "median",
          },
        ],

        "cumulative-layout-shift": [
          "error",
          {
            maxNumericValue: 0.1,
            aggregationMethod: "median",
          },
        ],
      },
    },

    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-report",
    },
  },
};
