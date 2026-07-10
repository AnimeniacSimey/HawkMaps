'''
Author:     Ali Rauf
Date:       2026-07-09
Description:
    - reads the "resteraunt_reviews.txt" file located in the "src/data" directory
    - processes its contents to fix encoding issues and formatting

    The script replaces certain characters, splits the text into entries, and ensures each entry is properly formatted for readability.

General App Usage:
    N/A

Testing through this script:
    - Update line 21 in this script to match the name of the input file if they are different.
    - Run this script directly to test the functionality of the 'updateReviews' function and also the 'createReview' function
'''

from pathlib import Path

# The file used to read the raw location data from
input_file = "resteraunt_reviews.txt"

# Extract the data from the "resteraunt_reviews.txt" file and print it to the console for debugging purposes
def extractReviews(filepath):
    # Open the file and read its contents
    f = open(filepath, "r")
    rawTXT = f.read()

    # Splitting each building entry by the delimiter "\n" to create a list of entries
    entries = rawTXT.split("\n")

    for entry in entries[3:]:  # Skip the first two lines which are headers or irrelevant
        entry = entry.strip()
        if entry == "":
            continue
        while entry.startswith(",") or entry.startswith("\""):
            entry = entry[1:]

        # Splitting the entry into its individual data fields using the tab delimiter
        data = entry.split("\t")

        # Print the data fields for debugging purposes
        print(data[0] + "," + data[1] + "," + data[2] + "," + data[3] + "," + data[4])

        # Do something with the data fields, such as creating a TypeScript object or updating a file


# Create a new review entry for the given data to be added to the filename file
def createReview(reviewData, filename):

    # Making sure that reviewData has the correct amount and types of data
    # If not, raise a ValueError with an appropriate message
    if len(reviewData) != 5:
        raise ValueError("Review data must contain exactly 5 elements: [resteraunt_name, rating, subject, body, date]")
    elif reviewData[1] not in ["1", "2", "3", "4", "5"]:
        raise ValueError("Rating must be a string representing an integer between 1 and 5 inclusive!")
    elif not all(isinstance(field, str) for field in reviewData):
        raise ValueError("All review data fields must be strings!")

    # Creating the string to write to the file
    review = reviewData[0] + "\t" + reviewData[1] + "\t" + reviewData[2] + "\t" + reviewData[3] + "\t" + reviewData[4] + "\n"

    # Appending the new review to the end of the file
    with open(filename, "a+") as f:

        # Ensure that the review ends with a newline character before writing it to the file
        f.seek(0, 2)  # Move the file pointer to the end of the file
        file_size = f.tell()  # Get the current file size

        if file_size > 0:
            f.seek(file_size - 1)  # Move the file pointer to the last character
            last_char = f.read(1)  # Read the last character

            if last_char != "\n":
                f.write("\n")  # Add a newline character if the last character is not a newline

        # Write the new review to the file
        f.write(review)

# Self-testing main
if __name__ == "__main__":

    # Get the directory of the project (..\\HawkMaps)
    inputPath = Path(__file__).resolve().parent.parent

    # Construct the path to the "campus_locations.txt" file in the "src/data" directory
    inputPath = inputPath / "src" / "data" / input_file

    # Call the extractReviews function to process the file and extract the review data
    extractReviews(inputPath)

    # Call the createReview function to add a new review entry to the "resteraunt_reviews.txt" file
    new_review_data = ["Tester Resteraunt Name", "4", "Tester Subject", "Tester Body", "15/06/2024"]
    createReview(new_review_data, inputPath)