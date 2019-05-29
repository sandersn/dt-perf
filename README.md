Performance is just measured using type counts from batch compilation.

## history.js

Print a CSV of historical Definitely Typed performance.

```
$ node history.js 2019-04-25 2019-05-15
```

## percentileOf.js

Print a report the previous percentile of a package, plus its new percentile.

```
$ node percentileOf.js gulp-jasmine 11715
gulp-jasmine:
Before	Count:	Percentile:
	9111	53.8
After:
	11715	74.8
```

## dependencies.js

Kind of a temp script for finding things that depend on react or aws. I think.

## typedLikelihood.js

First, remember to update `dtPath` if you want to count Definitely Typed types!

### Discussion

I came up with a way to answer the question, "Are we done?" with
respect to the mission "Types for all Javascript programmers", at
least for dependencies.

Basically, we're done when every package you want to install either
ships its own types or has a `@types` package. Think of this as "the
probability that a package has types, given that it is installed". The
second part is important: we don't care about typing the masses of
packages on npm with 2 downloads per month.

Unfortunately, we don't have a direct way to measure the probability
that a package you use has types. Fortunately, it's pretty simple.
Bayes' rule says that to find the probability that a package is typed
if it's installed, you start with the probability that a package is
typed at all, and then modify that base rate:

```
P(typed|installed) = P(typed) * P(installed|typed) / P(installed)
```

So we need three pieces of information:

1. P(typed), the base typing rate: what percent of packages have types.
2. P(installed), the install rate: what is the probability of *any* package being installed.
3. P(installed|typed), the typed package install rate: what is the probability of a package with types being installed.

To find these numbers, I sampled the npm package list 100,000 times:
1. Counted packages that have 'types' in package.json, or an entry on Definitely Typed.
2. Averaged the downloads/month for each package.
3. Averaged the downloads/month for each package that has types.

The resulting probability is 49%, so if you install a package based on
its popularity, there's a 49% chance that it has types. This is an
astounding number, especially since only 10% of packages were typed.
That means typed packages are 5 times more popular than average. Of
course we have a long way to go before programmers don't have to think
about their dependencies' types at all.

Of the typed packages, only 6% came from Definitely Typed, which means
that only 0.6% of npm packages have types on Definitely Typed -- which
is about right for DT's 6,000 to npm's 1,000,000. This confirms that
Definitely Typed as test suite, while useful and very large, is better
thought of as a sample than a snapshot of the entire typed world.

This analysis only models installing one package, so if packages were
independent, the probability of two packages both having types is
around 25% (0.49 * 0.49), and three packages is 12.5% (0.49**3). But
it also assumes that packages don't have dependencies; and since typed
packages probably cluster, the true probability of three typed
packages is probably higher than 12.5%.
