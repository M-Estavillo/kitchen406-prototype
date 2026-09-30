**CHAPTER 1**  
**INTRODUCTION**

This chapter presents the background and primary motivation for developing the Kitchen406 platform. It outlines the statement of the problem, the specific objectives the project aims to achieve, the significance of the study to various stakeholders, and the scope and limitations to clearly define the boundaries of the proposed system.

**1.1 Rationale**

Kitchen406 is a home-based bakery in Metro Cebu run by two owners, offering breads, pastries, and custom cakes on a made-to-order basis. Customers reach the business through social media and word-of-mouth, with most orders coming from repeat customers from the owners' immediate community. Orders are coordinated through Facebook Messenger and recorded on a whiteboard and a shared spreadsheet. This arrangement holds only because order volume is presently in a seasonal trough. Demand fluctuates sharply through the year, rising around holidays and occasions, where the same two-person operation has to manage volumes several times its usual output. This process is unsustainable at peak demand, when order volume is highest and the owners' available time is most constrained.

The business now plans to introduce a prepaid 4-week subscription line for bread and pastry products, which is produced in fixed batches and delivered on a scheduled day alongside existing custom and standard orders. The model originates with the owners rather than with customer demand, and its purpose is operational: batch production allows them to schedule activities, purchase ingredients against known quantities, and reduce the fuel cost of running the oven for scattered small orders. Each subscription creates a four-week fulfillment schedule that requires the owners to track fixed delivery days, remaining deliveries, and any skipped weeks pushed to the end of the cycle. With the owners' intended subscriber count goal, the business would need to track dozens of active subscriptions on overlapping and independently advancing schedules. A message-based intake channel can record such commitments but cannot enforce them, cannot hold the daily and weekly capacity limits the owners need, and cannot prevent overcommitment as subscription and made-to-order production compete for the same baking days.

The same shift exposes gaps in the surrounding process. Production in batch volume requires projecting ingredient consumption from confirmed orders, yet no bill of materials links a product to the quantities it consumes. Restocking is triggered only when supplies are visibly low rather than projected from a list of confirmed orders. Profitability is computed as total monthly sales against total monthly expenses, leaving per-product margin unknown in a market the owners describe as price-competitive. Payment is settled after delivery, an arrangement workable only because nearly every customer is personally known to the owners. The owners also intend to delegate order and inventory tasks to hired assistance while restricting access to sales and customer data, a separation neither a spreadsheet nor a whiteboard can enforce.

Maintaining a steady online presence is part of keeping the business visible to its existing community, yet this is the area that most consistently falls aside in day-to-day operations. Since the page was launched, only two posts have been published in the last six months. Posting falls to a single owner who has no background in marketing, and it competes for attention with production and customer messages, leaving it as the task most easily set aside when the day fills up. The result is not a lack of willingness but a lack of regularity, as composing a post from scratch is an effort that rarely rises to the top of a two-person operation's priorities. A scheduling tool alone would not resolve this, since the constraint is not when posts are published but the effort of composing them in the first place. A generative AI feature addresses that constraint directly by producing drafts the owners need only to review and approve, keeping the business's online presence active without adding to their daily workload.

Independent bakeries such as BreadHive show how a prepaid subscription model works in small-scale baking, where customers pay in advance for a weekly share collected on a fixed day, skipped weeks are accommodated only when arranged beforehand, and committed orders give the bakery a predictable production schedule (BreadHive, n.d.). Bakery inventory systems such as Cybake and Yokitup likewise illustrate how recipe costing, production planning, and demand forecasting help bakeries control material costs and reduce waste (Cybake, n.d.; Yokitup, n.d.), while AI content tools such as Marky show how digital post generation and scheduling help small businesses maintain a consistent social media presence (Marky, n.d.).

In response to these needs, this study proposes Kitchen406: An Online Ordering and Product Management Platform with a Generative AI Marketing Assistant, a centralized platform designed to improve order intake, production planning, and customer coordination for the bakery. The system will allow customers to browse products, subscribe to products, request custom cakes, and track their order status, with all orders requiring payment in full online before they are confirmed. For the owners, the system will consolidate incoming orders into a single view, enforce capacity limits through an order calendar, monitor product availability and ingredient stock against confirmed orders, guide pricing decisions based on ingredient costs, restrict staff access to order and inventory functions, summarize business performance through an analytics dashboard, and generate Facebook posts through an AI marketing assistant. Through these capabilities, Kitchen406 aims to reduce the time spent manually handling orders, improve scheduling and inventory visibility, strengthen the bakery's online presence, and provide a practical and scalable solution that supports the business as it grows toward daily operations.

#### **1.2 Statement of the Problem**

##### **1.2.1 General Objective**

This study will aim to design and develop Kitchen406: An Online Ordering and Product Management Platform with a Generative AI Marketing Assistant for a home-based bakery to support the bakery's business operations and customer transactions. 

##### **1.2.2 Specific Objectives**

Following the completion of this study, the following objectives are expected to be met:

1. Examine the existing ordering and customer communication processes of the bakery.

2. Design and develop an online ordering and product management platform with a generative AI marketing assistant.

3. Test and evaluate the platform for functionality throughout development, and for usability and user acceptance upon completion.

4. Deploy the developed platform to its production environment and turn it over to the owners of Kitchen406 for live business operation.

**1.3 Significance of the Study**

The output of the study will benefit the following:

**Kitchen406 Bakery**. It will replace a whiteboard and shared spreadsheet with a single production calendar covering standard orders, subscription fulfillments, and custom cakes, enforcing the owners' capacity limits at the point of booking rather than relying on recall. It will link confirmed orders to ingredient consumption so stock can be projected instead of inspected, and surface per-product cost and margin in place of the aggregate monthly computation the owners use now. Above all, it will make the planned prepaid subscription line operable which is a model requiring the tracking of standing obligations that persist across overlapping four-week cycles, alongside the seasonal order volumes the bakery already reaches at peak. Neither is reliably held by a manual arrangement at this scale.

**Customers.** It will allow customers to browse the catalogue, place orders, enroll in subscription packages, and submit custom cake requests through a dedicated web platform, with order status updates that remove the need to follow up by message.

**Home-Based Food Businesses**. It may serve as a reference implementation for single-kitchen operations considering a shift from chat-based order-taking to structured order and production management, demonstrating that fixed-term prepaid subscriptions, ingredient-linked costing, and AI-assisted content generation can be adopted without the staffing, infrastructure, or capital of a larger food service operation.

**Researchers**. It will give the research team hands-on experience building a system from start to finish. They will work directly with a real client to gather project needs and turn basic business rules into strict system features. The team will also practice designing the system, connecting external software, and building an artificial intelligence marketing assistant. Throughout this work, they will develop valuable skills in using advanced language tools, setting up digital payments, and creating websites that are optimized for mobile devices.

**Future Researchers**. It will document the design of a fixed-term prepaid subscription system for a micro-scale food producer, an operating model distinct from the auto-renewing subscriptions common in commercial platforms, and demonstrate an approach to AI-assisted marketing drawn from a business's own operational data with publication decisions retained by the owners.

**1.4 Scope and Limitations**

**1.4.1 Scope of the Study**

The primary scope of the study covers the development of the Kitchen406. Specifically, the system includes the following components:

1. This study covers the analysis, design, development, and deployment of a bespoke web-based order management, inventory, and scheduling system specifically for Kitchen406, a home-based bakery in Metro Cebu. The system is tailored exclusively to the client’s operational workflows and is not designed as a general-purpose Software-as-a-Service (SaaS) product for other bakeries.

2. The customer-facing platform will support three distinct purchasing workflows: Standard Orders, Fixed Prepaid Subscriptions, and Custom Cake Requests. To prevent overbooking, the system will feature a capacity-control module that enforces daily product limits, strict cut-off times, and mandatory lead times for specific order types. These capacity baselines and cut-offs will be configurable by the administrators to accommodate fluctuating operational capabilities. The customer interface will also provide centralized tracking of order statuses to minimize the need for manual communication. All customer transactions require a registered account. Guest checkout is not supported. Customers must create and log in to an account before placing standard orders, enrolling in subscriptions, or submitting custom cake requests. Additionally, customers will be able to save, manage, and label multiple delivery addresses within their accounts and select a preferred address during checkout, with address details subject to final confirmation before order submission.

3. Products designated as subscription-eligible may also be purchased individually through the standard ordering workflow, subject to their availability for regular purchase. Standard orders allow customers to select one or more products, specify their quantities, and choose a common fulfillment date for the transaction. Subscription enrollment is handled separately through a fixed four-week prepaid commitment consisting of one scheduled delivery per week. Both purchasing workflows remain subject to their respective capacity limits, lead times, cut-off times, and inventory availability.

4. The customer-facing interface will feature a review module allowing customers to submit ratings, optionally add text comments, and attach up to two photos per review upon order completion. For administration, the system will provide an administrative moderation interface granting owners the authority to hide or unhide customer reviews and feedback in cases of malicious, spam, or inappropriate content.

5. For Custom Cake Requests, the system will provide a modular selection interface to generate a preliminary cost estimate. This workflow will include an administrative review phase, allowing owners to negotiate final designs and issue a final quotation prior to approval. For subscriptions, the system will manage predefined delivery cycles and track allowable deferments or postponements requested by the customer.

6. For subscriptions, the system will allow customers to enroll in eligible products through a fixed four-week prepaid plan. Customers may select the available product variant, applicable subscription schedule, and delivery address. The subscription duration remains fixed at four weeks, with each enrollment generating four scheduled weekly deliveries. The system will also manage predefined delivery cycles and track allowable deferments or postponements requested by the customer.

7. The platform will feature an inventory management module driven by a Bill of Materials (BoM). The system will automatically project and deduct ingredient consumption based on confirmed orders. It will alert administrators when stock falls to predefined thresholds and dynamically disable the ordering of affected products when required ingredients are fully depleted, working in tandem with the daily capacity slots to prevent overcommitment.

8. The system will integrate an online payment gateway (QR Ph). To secure commitments, the system will enforce full online payment before confirming and scheduling production for standard orders, subscriptions, and finalized custom cake quotations. Additionally, the system will include a sales analytics dashboard that compares ingredient costs against product prices to calculate per-product margins and summarize overall business performance.

9. The system will implement Role-Based Access Control (RBAC), restricting hired staff to order fulfillment and inventory management while reserving sensitive financial, customer, and sales data strictly for the owners. Finally, the system will feature a generative AI assistant that automatically generates draft social media marketing posts when predefined business events occur (e.g., new product launches, upcoming holidays, low product demand, or available subscription slots), using system data as context. Review, approval, and posting of these drafts will remain under the owners' control.

**1.4.2 Limitations of the Study**

1. The subscription line is planned, not operational because it is an entirely new offering for Kitchen406 rather than a digitized version of an existing one, the business has no prior subscription sales history to serve as a reference point, so demand, uptake, and any related projections remain untested.

2. The study does not evaluate customer acquisition or market expansion. While the generative AI marketing assistant supports content creation, the evaluation of its impact on customer growth, conversion rates, and market reach is outside the scope of the study. The study primarily focuses on improving order management, marketing operations, and order fulfillment processes once customers engage with the business.

3. The system's review moderation is strictly reliant entirely on administrative oversight. The platform does not incorporate automated sentiment analysis, natural language filtering for profanity, or an automated dispute-resolution workflow for addressing negative or malicious customer feedback.

4. The performance of the integrated AI marketing module will be measured by output efficiency like draft acceptance rate. The study does not evaluate downstream marketing metrics such as follower growth, user engagement, or resulting sales, as these depend on external market factors. Additionally, it is limited to content drafting and cannot independently publish or schedule posts to external social media platforms.

5. Custom cake pricing remains manual for design and complexity. The system automatically computes pricing based on predetermined options such as the cake's size, but pricing for design and complexity is still the owner's case-by-case judgment call, not something the system calculates.

6. The system does not support discounts, vouchers, or promotional codes. Order totals are calculated from product prices and applicable fees only, with no mechanism for applying price reductions, coupon codes, or promotional pricing at checkout.

7. Payment handling is limited to QR Ph. It serves as the platform's sole payment gateway, with no direct card or other e-wallet integrations supported.

8. Delivery for standard orders and subscription deliveries is through a third-party courier, while custom cakes are delivered manually by the owners. Standard-order and subscription delivery are booked and tracked through the Lalamove API, with each week's subscription fulfillment represented as its own order for this purpose. Custom cake delivery logistics fall entirely outside the system, handled independently by the owners.

9. Costing accuracy depends on client-supplied data. Any figures the system produces around ingredient costing are only as accurate as the recipe and pricing data the owners themselves supply and keep current, since the system does not independently verify or update this information.

10. Inventory tracking is limited to single-level ingredients. The system tracks only the individual base ingredients directly used in a product's Bill of Materials (BoM) and does not track intermediate or prepared components as separate inventory items. For example, the system may track the flour, yeast, and other ingredients used to make dough, but the resulting dough itself is not maintained as a separate inventory item with its own stock quantity and Bill of Materials. 

11. The study evaluates the system's capacity to handle orders, but cannot guarantee customer adoption. Whether end-users successfully transition from their current habit of informal messaging to utilizing the centralized web platform is a behavioral metric outside the control of this study.

12. The platform enforces strict minimum lead times across all workflows. The system is structurally designed to prohibit same-day processing; any immediate or rushed fulfillment requests cannot be processed through the platform. 

13. The study does not include hardware integration. The proposed system is designed as a web-based solution and does not integrate with specialized hardware devices such as point-of-sale (POS) terminals, barcode scanners, weighing scales, or automated inventory-tracking equipment. Inventory updates and operational data rely on user input within the system rather than direct communication with physical devices.

14. The system's full operational capability relies on the stability of external services. Any downtime, rate-limiting, or service deprecation from these third-party providers is beyond the scope and control of the developers. 