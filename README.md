# Validator

Validates &lt;input&gt; or &lt;textarea&gt; elements at specified context.

Selects all fields by **name** attribute. Checks for **require** and **minlength** attribute. It also can check each field value by a **regular expression**.

## Supported regular expressions:

- E-mail
- IP address
- Phone number
- URL

## Example

In this example we will try to validate next fields: "login" as email address, "phone", "password", "password-confirm" and "comment" (&lt;textarea&gt;) field.

- The "login" is a **required** field and must be validated by **email** regular expression;
- The "phone" is a **required** field and must be validated by **phone** regular expression;
- The "password" is a **required** field and must have the **minimum** length at least **6 symbols**;
- The "password-confirm" is a **required** field and must have the **minimum** length at least **6 symbols**. It also must be have same value such as "password" field;
- And the "comment" is a required field;

HTML

```html
<form novalidate id="example-form">
    <div class="form-group">
        <label>Login</label>
        <input type="text" name="login" required data-validator-pattern="email" data-validator-messages='{ "pattern": "Invalid email address", "required": "This is a required field" }' class="form-control" />
    </div>
    <div class="form-group">
        <label>Phone</label>
        <input type="text" name="phone" required data-validator-pattern="phone" data-validator-messages='{ "pattern": "Invalid phone number", "required": "This is a required field" }' class="form-control" />
    </div>
    <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required minlength="6" data-validator-messages='{ "equals": "Password mismatch", "minlength": "Too short password", "required": "This is a required field" }' class="form-control" />
    </div>
    <div class="form-group">
        <label>Confirm password</label>
        <input type="password" name="password-confirm" required minlength="6" data-validator-messages='{ "equals": "Password mismatch", "minlength": "Too short password", "required": "This is a required field" }' class="form-control" />
    </div>
    <div class="form-group">
        <label>Comment</label>
        <textarea name="comment" required rows="3" data-validator-messages='{ "required": "This is a required field" }' class="form-control"></textarea>
    </div>
    <button type="submit" class="btn btn-success" id="validate-btn">Validate</button>
</form>
```

Javascript

```javascript
var form = document.getElementById('example-form');
form.addEventListener('submit', function(e) {
    // create new instance of Validator object
    var validator = new Validator(form, {
        // fields in the specified context, that will be validated
        fields: ['login', 'phone', 'password', 'password-confirm', 'comment'],
        // fields in the specified context, that will be checked for equal values
        equals: ['password', 'password-confirm']
    });
    // Don't forget this!
    e.preventDefault();
    // run validation!
    validator.validate();
}, false);
```
