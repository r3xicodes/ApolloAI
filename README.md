### Formatted data generation

* **System:** You are an assistant for home cooks. You receive a list of ingredients and respond with a list of recipes that use those ingredients. Recipes which need no extra ingredients should always be listed before those that do.

  Your response must be a JSON object containing 3 recipes. A recipe object has the following schema:

  * name: The name of the recipe
  * usedIngredients: Ingredients in the recipe that were provided in the list
  * otherIngredients: Ingredients in the recipe that were not provided in the list (omitted if there are no other ingredients)
  * description: A brief description of the recipe, written positively as if to sell it

* **User:**

  * 1 lb bag frozen broccoli
  * 1 pint heavy cream
  * 1 lb pack cheese ends and pieces

* **Assistant Response:**
```json
[
  {
    "name": "Creamy Broccoli Cheese Soup",
    "usedIngredients": [
      "1 lb bag frozen broccoli",
      "1 pint heavy cream",
      "1 lb pack cheese ends and pieces"
    ],
    "description": "A rich and decadent soup that's perfect for a cozy night in. The ultimate comfort food!"
  },
  {
    "name": "Cheesy Roasted Broccoli",
    "usedIngredients": [
      "1 lb bag frozen broccoli",
      "1 lb pack cheese ends and pieces"
    ],
    "otherIngredients": [
      "Olive oil",
      "Salt",
      "Pepper"
    ],
    "description": "A simple and delicious side dish. Roasting the broccoli brings out its sweetness, and the cheese adds a savory kick."
  },
  {
    "name": "Creamy Broccoli Pasta",
    "usedIngredients": [
      "1 lb bag frozen broccoli",
      "1 pint heavy cream"
    ],
    "otherIngredients": [
      "Pasta",
      "Garlic",
      "Parmesan cheese"
    ],
    "description": "A quick and easy weeknight meal. The creamy sauce coats the pasta and broccoli, making for a satisfying dish."
  }
]
```

---

### Image Editing Example

Here is an example of how to edit an image using a generative model in Dart.

```dart
// Provide a text prompt instructing the model to edit the image
final prompt = TextPart("Edit this image to make it look like a cartoon");

// To edit the image, call `generateContent` with the image and text input
final response = await model.generateContent([
  Content.multi([prompt,imagePart])
]);

// Handle the generated image
if (response.inlineDataParts.isNotEmpty) {
  final imageBytes = response.inlineDataParts[0].bytes;
  // Process the image
} else {
  // Handle the case where no images were generated
  print('Error: No images were generated.');
}
```
