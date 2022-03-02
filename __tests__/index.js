var serialize = require("../");

function makeDOMForm(innerHTML) {
  let form = document.createElement("form");
  form.innerHTML = innerHTML;
  return form;
}

function hash_check(form) {
  return serialize(form, { hash: true });
}

function str_check(form) {
  return serialize(form);
}

function disabled_check(form) {
  return serialize(form, { hash: false, disabled: true });
}

function empty_check(form) {
  return serialize(form, { hash: false, disabled: true, empty: true });
}

function empty_check_hash(form) {
  return serialize(form, { hash: true, disabled: true, empty: true });
}

test("null form", function() {
  expect(hash_check(null)).toEqual({});
  expect(str_check(null)).toEqual("");
  expect(empty_check(null)).toEqual("");
  expect(empty_check_hash(null)).toEqual({});
});

test("bad form", function() {
  let form = {};
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
  expect(empty_check(form)).toEqual("");
  expect(empty_check_hash(form)).toEqual({});
});

test("empty form", function() {
  let form = makeDOMForm();
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
  expect(empty_check(form)).toEqual("");
  expect(empty_check_hash(form)).toEqual({});
});

// basic form with single input
test("single element", function() {
  let form = makeDOMForm('<input type="text" name="foo" value="bar"/>');
  expect(hash_check(form)).toEqual({ foo: "bar" });
  expect(str_check(form)).toEqual("foo=bar");
  expect(empty_check(form)).toEqual("foo=bar");
  expect(empty_check_hash(form)).toEqual({ foo: "bar" });
});

test("ignore no value", function() {
  let form = makeDOMForm('<input type="text" name="foo"/>');
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
});

test("do not ignore no value when empty option", function() {
  let form = makeDOMForm('<input type="text" name="foo"/>');
  expect(empty_check(form)).toEqual("foo=");
  expect(empty_check_hash(form)).toEqual({ foo: "" });
});

test("multi inputs", function() {
  let form = makeDOMForm(
    '<input type="text" name="foo" value="bar 1"/>' +
      '<input type="text" name="foo.bar" value="bar 2"/>' +
      '<input type="text" name="baz.foo" value="bar 3"/>'
  );
  expect(hash_check(form)).toEqual({
    foo: "bar 1",
    "foo.bar": "bar 2",
    "baz.foo": "bar 3"
  });
  expect(str_check(form)).toEqual("foo=bar+1&foo.bar=bar+2&baz.foo=bar+3");
});

test("handle disabled", function() {
  let form = makeDOMForm(
    '<input type="text" name="foo" value="bar 1"/>' +
      '<input type="text" name="foo.bar" value="bar 2" disabled/>'
  );
  expect(hash_check(form)).toEqual({ foo: "bar 1" });
  expect(str_check(form)).toEqual("foo=bar+1");
  expect(disabled_check(form)).toEqual("foo=bar+1&foo.bar=bar+2");
});

test("handle disabled and empty", function() {
  let form = makeDOMForm(
    '<input type="text" name="foo" value=""/>' +
      '<input type="text" name="foo.bar" value="" disabled/>'
  );
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
  expect(disabled_check(form)).toEqual("");
  expect(empty_check(form)).toEqual("foo=&foo.bar=");
  expect(empty_check_hash(form)).toEqual({ foo: "", "foo.bar": "" });
});

test("ignore buttons", function() {
  let form = makeDOMForm(
    '<input type="submit" name="foo" value="submit"/>' +
      '<input type="reset" name="foo.bar" value="reset"/>'
  );
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
});

test("checkboxes", function() {
  let form = makeDOMForm(
    '<input type="checkbox" name="foo" checked/>' +
      '<input type="checkbox" name="bar"/>' +
      '<input type="checkbox" name="baz" checked/>'
  );
  expect(hash_check(form)).toEqual({ foo: true, baz: true });
  expect(str_check(form)).toEqual("foo=true&baz=true");
  expect(empty_check(form)).toEqual("foo=true&bar=false&baz=true");
  expect(empty_check_hash(form)).toEqual({ foo: true, bar: false, baz: true });
});

test("checkboxes - array", function() {
  let form = makeDOMForm(
    '<input type="checkbox" name="foo[]" value="bar" checked />' +
      '<input type="checkbox" name="foo[]" value="baz" checked />' +
      '<input type="checkbox" name="foo[]" value="baz"/>'
  );
  expect(hash_check(form)).toEqual({ foo: ["bar", "baz"] });
  expect(str_check(form)).toEqual("foo%5B%5D=bar&foo%5B%5D=baz");
  expect(empty_check(form)).toEqual("foo%5B%5D=bar&foo%5B%5D=baz&foo%5B%5D=false");
  expect(empty_check_hash(form)).toEqual({ foo: ["bar", "baz", false] });
});

test("checkboxes - array with single item", function() {
  let form = makeDOMForm(
    '<input type="checkbox" name="foo[]" value="bar" checked/>'
  );
  expect(hash_check(form)).toEqual({ foo: ["bar"] });
  expect(str_check(form)).toEqual("foo%5B%5D=bar");
});

test("select - single", function() {
  let form = makeDOMForm(
    '<select name="foo">' +
      '<option value="bar">bar</option>' +
      '<option value="baz" selected>baz</option>' +
      "</select>"
  );
  expect(hash_check(form)).toEqual({ foo: "baz" });
  expect(str_check(form)).toEqual("foo=baz");
});

test("select - single - empty", function() {
  let form = makeDOMForm(
    '<select name="foo">' +
      '<option value="">empty</option>' +
      '<option value="bar">bar</option>' +
      '<option value="baz">baz</option>' +
      "</select>"
  );
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
  expect(empty_check(form)).toEqual("foo=");
  expect(empty_check_hash(form)).toEqual({ foo: "" });
});

test("select - multiple", function() {
  let form = makeDOMForm(
    '<select name="foo" multiple>' +
      '<option value="bar" selected>bar</option>' +
      '<option value="baz">baz</option>' +
      '<option value="cat" selected>cat</option>' +
      "</select>"
  );
  expect(hash_check(form)).toEqual({ foo: ["bar", "cat"] });
  expect(str_check(form)).toEqual("foo=bar&foo=cat");
});

test("select - multiple - empty", function() {
  let form = makeDOMForm(
    '<select name="foo" multiple>' +
      '<option value="">empty</option>' +
      '<option value="bar">bar</option>' +
      '<option value="baz">baz</option>' +
      '<option value="cat">cat</option>' +
      "</select>"
  );
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
  expect(empty_check(form)).toEqual("foo=");
  expect(empty_check_hash(form)).toEqual({ foo: "" });
});

test("radio - no default", function() {
  let form = makeDOMForm(
    '<input type="radio" name="foo" value="bar1"/>' +
      '<input type="radio" name="foo" value="bar2"/>'
  );
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
  expect(empty_check(form)).toEqual("foo=");
  expect(empty_check_hash(form)).toEqual({ foo: "" });
});

test("radio - single default", function() {
  let form = makeDOMForm(
    '<input type="radio" name="foo" value="bar1" checked="checked"/>' +
      '<input type="radio" name="foo" value="bar2"/>'
  );
  expect(hash_check(form)).toEqual({ foo: "bar1" });
  expect(str_check(form)).toEqual("foo=bar1");
  expect(empty_check(form)).toEqual("foo=bar1");
  expect(empty_check_hash(form)).toEqual({ foo: "bar1" });
});

test("radio - empty value", function() {
  let form = makeDOMForm(
    '<input type="radio" name="foo" value="" checked="checked"/>' +
      '<input type="radio" name="foo" value="bar2"/>'
  );
  expect(hash_check(form)).toEqual({});
  expect(str_check(form)).toEqual("");
  expect(empty_check(form)).toEqual("foo=");
  expect(empty_check_hash(form)).toEqual({ foo: "" });
});

// in this case the radio buttons and checkboxes share a name key
// the checkbox value should still be honored
test("radio w/checkbox", function() {
  let form = makeDOMForm(
    '<input type="radio" name="foo" value="bar1" checked="checked"/>' +
      '<input type="radio" name="foo" value="bar2"/>' +
      '<input type="checkbox" name="foo" value="bar3" checked="checked"/>' +
      '<input type="checkbox" name="foo" value="bar4"/>'
  );
  expect(hash_check(form)).toEqual({ foo: ["bar1", "bar3"] });
  expect(str_check(form)).toEqual("foo=bar1&foo=bar3");

  // leading checkbox
  form = makeDOMForm(
    '<input type="checkbox" name="foo" value="bar3" checked="checked"/>' +
      '<input type="radio" name="foo" value="bar1" checked="checked"/>' +
      '<input type="radio" name="foo" value="bar2"/>' +
      '<input type="checkbox" name="foo" value="bar4"/>' +
      '<input type="checkbox" name="foo" value="bar5" checked="checked"/>'
  );
  expect(hash_check(form)).toEqual({ foo: ["bar3", "bar1", "bar5"] });
  expect(str_check(form)).toEqual("foo=bar3&foo=bar1&foo=bar5");
});

test("bracket notation - hashes", function() {
  let form = makeDOMForm(
    '<input type="email" name="account[name]" value="Foo Dude">' +
      '<input type="text" name="account[email]" value="foobar@example.org">' +
      '<input type="text" name="account[address][city]" value="Qux">' +
      '<input type="text" name="account[address][state]" value="CA">' +
      '<input type="text" name="account[address][empty]" value="">'
  );

  expect(hash_check(form)).toEqual({
    account: {
      name: "Foo Dude",
      email: "foobar@example.org",
      address: {
        city: "Qux",
        state: "CA"
      }
    }
  });

  expect(empty_check_hash(form)).toEqual({
    account: {
      name: "Foo Dude",
      email: "foobar@example.org",
      address: {
        city: "Qux",
        state: "CA",
        empty: ""
      }
    }
  });
});

test("bracket notation - hashes with a digit as the first symbol in a key", function() {
  let form = makeDOMForm(
    '<input type="text" name="somekey[123abc][first]" value="first_value">' +
      '<input type="text" name="somekey[123abc][second]" value="second_value">'
  );

  expect(hash_check(form)).toEqual({
    somekey: {
      "123abc": {
        first: "first_value",
        second: "second_value"
      }
    }
  });

  expect(empty_check_hash(form)).toEqual({
    somekey: {
      "123abc": {
        first: "first_value",
        second: "second_value"
      }
    }
  });
});

test("bracket notation - select multiple", function() {
  let form = makeDOMForm(
    '<select name="foo" multiple>' +
      '  <option value="bar" selected>Bar</option>' +
      '  <option value="baz">Baz</option>' +
      '  <option value="qux" selected>Qux</option>' +
      "</select>"
  );

  expect(hash_check(form)).toEqual({ foo: ["bar", "qux"] });

  // Trailing notation on select.name.
  form = makeDOMForm(
    '<select name="foo[]" multiple>' +
      '  <option value="bar" selected>Bar</option>' +
      '  <option value="baz">Baz</option>' +
      '  <option value="qux" selected>Qux</option>' +
      "</select>"
  );

  expect(hash_check(form)).toEqual({ foo: ["bar", "qux"] });
});

test("bracket notation - select multiple, nested", function() {
  let form = makeDOMForm(
    '<select name="foo[bar]" multiple>' +
      '  <option value="baz" selected>Baz</option>' +
      '  <option value="qux">Qux</option>' +
      '  <option value="norf" selected>Norf</option>' +
      "</select>"
  );

  expect(hash_check(form)).toEqual({ foo: { bar: ["baz", "norf"] } });
});

test("bracket notation - select multiple, empty values", function() {
  let form = makeDOMForm(
    '<select name="foo[bar]" multiple>' +
      "  <option selected>Default value</option>" +
      '  <option value="" selected>Empty value</option>' +
      '  <option value="baz" selected>Baz</option>' +
      '  <option value="qux">Qux</option>' +
      '  <option value="norf" selected>Norf</option>' +
      "</select>"
  );

  expect(hash_check(form)).toEqual({
    foo: { bar: ["Default value", "baz", "norf"] }
  });

  expect(empty_check_hash(form)).toEqual({
    foo: { bar: ["Default value", "", "baz", "norf"] }
  });
});

test("bracket notation - non-indexed arrays", function() {
  let form = makeDOMForm(
    '<input name="people[][name]" value="fred" />' +
      '<input name="people[][name]" value="bob" />' +
      '<input name="people[][name]" value="bubba" />'
  );

  expect(hash_check(form)).toEqual({
    people: [{ name: "fred" }, { name: "bob" }, { name: "bubba" }]
  });
});

test("bracket notation - nested, non-indexed arrays", function() {
  let form = makeDOMForm(
    '<input name="user[tags][]" value="cow" />' +
      '<input name="user[tags][]" value="milk" />'
  );

  expect(hash_check(form)).toEqual({
    user: {
      tags: ["cow", "milk"]
    }
  });
});

test("bracket notation - indexed arrays", function() {
  let form = makeDOMForm(
    '<input name="people[2][name]" value="bubba" />' +
      '<input name="people[2][age]" value="15" />' +
      '<input name="people[0][name]" value="fred" />' +
      '<input name="people[0][age]" value="12" />' +
      '<input name="people[1][name]" value="bob" />' +
      '<input name="people[1][age]" value="14" />' +
      '<input name="people[][name]" value="frank">' +
      '<input name="people[3][age]" value="2">'
  );

  expect(hash_check(form)).toEqual({
    people: [
      {
        name: "fred",
        age: "12"
      },
      {
        name: "bob",
        age: "14"
      },
      {
        name: "bubba",
        age: "15"
      },
      {
        name: "frank",
        age: "2"
      }
    ]
  });
});

test("bracket notation - bad notation", function() {
  let form = makeDOMForm(
    '<input name="[][foo]" value="bar" />' +
      '<input name="[baz][qux]" value="norf" />'
  );

  expect(hash_check(form)).toEqual({
    _values: [{ foo: "bar" }],
    baz: { qux: "norf" }
  });
});

test("custom serializer", function() {
  let form = makeDOMForm(
    '<form><input type="text" name="node" value="zuul">/</form>'
  );

  expect(
    serialize(form, {
      serializer: function(curry, k, v) {
        curry[k] = "ZUUL";
        return curry;
      }
    })
  ).toEqual({
    node: "ZUUL"
  });
});
