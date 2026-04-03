Curiosity Report: Feature Flags

Throughout this course, I spent a lot of time deploying my application using CI pipelines and AWS services. Each time I pushed changes the new version was immediately deployed to production. While this automation made deployments faster, it also made them feel risky. If something broke, it would affect all users at once, and the only solution was to quickly fix the issue and redeploy.
This made me curious about how real-world companies handle deployments more safely. I had heard about the idea of “releasing features gradually” and wanted to understand how that actually works in practice. This led me to explore feature flags and how they are used in modern software development.

What Are Feature Flags?
Feature flags (also known as feature toggles) are a technique that allows developers to enable or disable specific functionality in an application without deploying new code. Instead of controlling behavior purely through code changes, developers can use configuration to decide which features are active.
A simple example of a feature flag looks like this:
        if (featureFlags.newCheckout) {
        showNewCheckout();
        } else {
        showOldCheckout();
        }
In this case, the application contains both versions of the feature, but the flag determines which one users see.

Types of Feature Flags
I found that there are several common types of feature flags used in practice:
•	Release Flags: Used to gradually roll out new features to users.
•	Experiment Flags: Used for A/B testing different versions of a feature.
•	Operational Flags: Used to quickly disable features if something goes wrong.
Each type serves a different purpose, but they all provide flexibility in controlling application behavior after deployment.

How Feature Flags Are Used in Real Systems
Feature flags are commonly used to reduce the risk of deploying new features. Instead of releasing a feature to all users at once, companies can enable it for a small percentage of users first. For example, a feature might be released to 5% of users, then 10%, and eventually 100% if no issues are detected.
This approach allows teams to test features in a real production environment while limiting the impact of potential bugs. If a problem occurs, the feature can be disabled instantly without requiring a new deployment.
Feature flags also make it possible to test features in production before fully releasing them. Developers can deploy incomplete or experimental features and keep them hidden until they are ready.

Why Feature Flags Matter in DevOps
Feature flags play an important role in modern DevOps practices because they separate deployment from release.
This class gave me a clearer picture of deployment and how big companies are doing it, every deployment immediately releases new functionalities to users. This creates risk because any bug introduced in a deployment affect the entire system. Feature flags solve this problem by allowing code to be deployed without being immediately exposed to users.
This can enable things like safer deployments, faster rollback and continuous delivery without constant risk.
Feature flags also improve collaboration between teams. Developers can deploy code independently, while product managers can control when features are released.

Downsides and Challenges
While feature flags provide many benefits, I read that they can also introduce complexity.
One major issue is that they can clutter the codebase. Over time, many conditional statements can accumulate, making the code harder to read and maintain.
Another challenge is managing old flags. If flags are not removed after a feature is fully released, they can become technical debt and create confusion.
Finally, feature flags require additional infrastructure, such as configuration management or external tools, which can add complexity to a system.

Connection to deliverables
While working on my deliverables I noticed that every deployment through GitHub Actions immediately affected the production system. If something broke, the only option was to fix the issue and redeploy the application.
Feature flags could allow me to deploy new functionalities without maybe exposing to possible attackers right away. For example, if these projects were compromising real-people data, feature flags could help me test new features on small groups of users and disable them instantly if issues occurred.

