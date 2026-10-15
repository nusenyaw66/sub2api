# Admin manual: Groups, Channels, models, discounts, and user visibility

This is the operator guide for the admin console. Customers never open these screens. They only see the groups you grant them, on **API Keys** and **Available Models**.

Sign in as an admin. The pages used below are:

| Screen | Sidebar |
| --- | --- |
| Users | **Users** |
| Groups | **Groups** |
| Channels | **Channels** → **Channel Pricing** |
| Upstream accounts | **Accounts** |

## How the three pieces fit

A **group** is the package a customer binds an API key to. It decides the upstream accounts, the discount, and who is allowed to use it.

A **channel** is the price list for that package. It lists model names and the unit prices (per 1M tokens, per request, per image, or per second of video).

A **user grant** decides whether one person can see that group, and whether they pay the group discount or a private one.

```text
unit price  ×  rate multiplier  =  price the customer pays
(channel, or a group override)   (group default, or that user's custom rate)
```

`1.0` is the listed price. `0.5` is half price. `2.0` is double. The number is a multiplier, so a discount is a value below `1`.

Price lookup order for one request:

1. **Per-model group pricing** on the group, when that model matches.
2. **Model Pricing** on the channel that contains the group.
3. The built-in model price, when neither of the above matches.

A group belongs to at most one channel. If it is already linked, the channel form marks it **In "{name}"** and will not let you attach it again.

## Recommended setup order

1. Create the upstream accounts and note which ones this package should use.
2. Create the group: platform, rate, public or exclusive, and those accounts.
3. Create the channel, attach the group, and enter model prices.
4. On **Users**, open **Groups** for the customer and grant the package (and a private rate, if they should not pay the group default).
5. Sign in as that user and check **Available Models**, then create an API key on that group.

Leave **Billing Type** on **Standard (Balance)** for pay-as-you-go customers. **Subscription (Quota)** is a different product and is not covered here. Billing type cannot be changed after the group is created. Platform cannot be changed either.

## 1. Create the group

Open **Groups** → **Create Group**.

| Field | What to set |
| --- | --- |
| **Group Name** | The name the customer sees, for example `Acme Standard` or `Acme VIP`. |
| **Platform Restriction** | The provider this package serves (`Anthropic`, `OpenAI`, `Gemini`, and so on). |
| **Rate Multiplier** | The package discount. `1.0` list price, `0.8` is 20% off, `0.5` is half price. |
| **Exclusive Group** | Off = every customer can use it. On = hidden until you assign it. See [visibility](#3-show-a-group-to-one-user). |
| **Designated Accounts** | The upstream accounts requests in this group may use. Leave empty for no account restriction. |
| **Status** | **Active**. A disabled group is not a usable package. |

Save. The group exists, but it still has no customer price list until a channel is attached.

### Limit which models the group accepts

In the same group form, **Model Allowlist**:

- Off: the group does not add its own model filter.
- On: a request whose model is outside the list is rejected with `404 model_not_found`. Model lists for that group only show allowlisted models.

Entries can be exact IDs (`claude-sonnet-4-5`) or patterns with `*` anywhere (`gpt-*`, `gpt-*-codex`). Claude Code also calls small Haiku-family models for titles and summaries, and those calls are checked against this list. If those customers use Claude Code, keep the small models they probe with.

This is an access filter. It does not set the price. Prices live on the channel, or in **Per-model group pricing** below.

### Optional price override on the group

**Per-model group pricing** replaces the channel price (and the built-in price) for the models you list. Use it when one package must charge a different unit price than the other groups on the same channel. Long-context ladders still come from the official presets; **Enable long-context tier pricing** turns those tiers on. When it is off, the first tier is used.

Most packages do not need this. Put the shared price list on the channel, and use **Rate Multiplier** for the discount.

Image and video have their own switches on the group:

- **Use independent image multiplier** / **Image multiplier** — image jobs use this multiplier instead of the group rate.
- **Use independent video multiplier** / **Video multiplier** — video jobs use this multiplier instead of the group rate.

**Requests Per Minute (RPM)** and **RPM Overrides** cap request speed. They do not change the price.

## 2. Put models and prices on a channel

Open **Channels** → **Channel Pricing** → **Create Channel**.

### Attach the group

Under **Associated Groups**, select the group from step 1. One channel can hold several groups that should share the same model list and unit prices. Each of those groups still has its own rate multiplier, so the same unit price can be sold at different discounts.

Select at least one group. A group already used by another channel cannot be selected.

### Add the model price list

**Model Pricing** → add an entry:

1. **Models** — type the full model id and press Enter. Paste several names to import them together.
2. **Billing Mode**
   - **Token** — input, output, cache write, and cache read, priced per 1M tokens.
   - **Per Request** — one price per call.
   - **Image (Per Request)** — one price per image.
   - **Video (Per Second)** — price per second, with optional resolution tiers.
3. Enter the unit prices. These are the prices *before* the group rate. A token input price of `3` and a group rate of `0.8` bills the customer `$2.40` per 1M input tokens.

**Restrict Models**: when on, only models that appear in this channel's pricing list are allowed. Anything else is rejected. Turn this on when the package must not fall through to built-in prices for unnamed models.

**Model Mapping** rewrites the customer's model name to the upstream name before the account mapping runs. **Billing Model** chooses which name is used to look up the price: the channel-mapped name, the name the client sent, or the final upstream name. Leave mapping empty when the client already sends the upstream model id.

**Sync Latest Models** pulls model ids that are not in the list yet. It does not fill in prices. Review new rows and set prices before you rely on them.

Save the channel with status **Active**.

### What the customer is billed

For a token model the customer price is:

| Line | Formula |
| --- | --- |
| Input | channel input price × effective rate |
| Output | channel output price × effective rate |
| Cache write | channel cache-write price × effective rate |
| Cache read | channel cache-read price × effective rate |

The effective rate is that user's **Custom Rate** for the group when you set one, otherwise the group's **Rate Multiplier**. Image and video jobs use their independent multipliers when those switches are on.

**Available Models** shows these already-multiplied prices. If the same model has two different prices across groups the user can see, they get one card per price, labeled with the group name. Identical prices collapse to one card.

## 3. Show a group to one user

Visibility is not a flag on the user alone. It is the combination of the group's **Exclusive Group** switch and the user's **Groups** dialog.

Open **Users**, open the action menu on the user, and choose **Groups**. The dialog title is **User Group Configuration**.

### Public group (Exclusive off)

Every user can use it, and it appears in their API key group picker and on **Available Models**.

To hide a public group from one user:

1. In that user's **Groups** dialog, turn on **Restrict accessible public groups**.
2. Check only the public groups that user may use.
3. Save.

While the switch is off, every public group stays available to that user. The checkboxes are only real grants after the switch is on.

### Exclusive group (Exclusive on)

Users cannot see it and cannot bind an API key to it until you assign them.

1. Create or edit the group and turn **Exclusive Group** on.
2. Open **Users** → that user → **Groups**.
3. Under **Exclusive Groups**, check the group.
4. Save.

Uncheck it to take the package away. Existing keys on that group stop being a valid choice for that user.

Use an exclusive group when the package is only for named customers: a private model list, a steeper discount, or a dedicated account pool.

### Private discount for one user

The same **Groups** dialog has **Custom Rate** on each group row.

- Leave it empty to charge the group's **Rate Multiplier** (**Default Rate** on that row).
- Enter a number to override it for this user only. `0.7` on a group whose default is `1.0` is 30% off for this user and nobody else.

You can set the same override from the group side: **Groups** → **Rate Multipliers** → **Add User Rate Multiplier**. That writes the same per-user rate. Empty means "use the group default."

Custom rate changes the multiplier, not the channel unit price. Two users on the same group and the same models pay different amounts only when their custom rates differ.

## Worked example

Goal: most customers pay list price for Claude. One customer, `vip@acme.com`, pays 30% off and must not see the public package.

1. **Accounts** — put the Claude upstream accounts in place.
2. **Groups** → **Create Group**
   - Name: `Claude Public`
   - Platform: Anthropic
   - Rate Multiplier: `1.0`
   - Exclusive: off
   - Designated Accounts: the shared Claude accounts
3. **Groups** → **Create Group**
   - Name: `Claude Acme`
   - Platform: Anthropic
   - Rate Multiplier: `0.7`
   - Exclusive: on
   - Designated Accounts: the same accounts, or a private pool
4. **Channel Pricing** → **Create Channel**
   - Associated Groups: `Claude Public` and `Claude Acme` (they share unit prices; the rate differs)
   - Model Pricing: `claude-sonnet-4-5` and `claude-haiku-4-5`, billing mode **Token**, with input, output, cache write, and cache read prices
   - Restrict Models: on
5. **Users** → `vip@acme.com` → **Groups**
   - Check **Claude Acme** under **Exclusive Groups**
   - Turn on **Restrict accessible public groups** and leave `Claude Public` unchecked, so this user cannot also pick the list-price package
   - Leave **Custom Rate** empty, because `0.7` is already the group rate
6. Sign in as `vip@acme.com`. **Available Models** should list the Claude models at 70% of the channel unit price, attributed to `Claude Acme`. **API Keys** should offer `Claude Acme` and not `Claude Public`.

If only this one user should get `0.7` and everyone else on `Claude Public` stays at `1.0`, skip the second group. Open their **Groups** dialog and set **Custom Rate** to `0.7` on `Claude Public`.

## Checks when a customer reports the wrong catalog

| What they see | What to check |
| --- | --- |
| Group missing on **API Keys** or **Available Models** | Group status is **Active**. Exclusive groups must be checked on that user. If **Restrict accessible public groups** is on, the public group must be checked too. |
| Model missing, group is visible | The model is on the channel **Model Pricing** list, or the group **Model Allowlist** includes it. **Restrict Models** hides anything not priced on the channel. |
| Price looks like list price | Group **Rate Multiplier** is still `1.0`, or this user's **Custom Rate** is empty and the group rate is `1.0`. Image or video may be using an independent multiplier instead of the group rate. |
| Price ignores the channel | The group has **Per-model group pricing** for that model. That override wins over the channel. |
| Cannot attach the group to a new channel | The group is already in another channel. Edit that channel, or remove the group from it first. A group has one channel. |
| Discount applied to the wrong person | **Custom Rate** is per user. The group **Rate Multiplier** applies to everyone who does not have a custom rate. |
