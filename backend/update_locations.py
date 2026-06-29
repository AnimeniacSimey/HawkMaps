'''
Author:     Ali Rauf
Date:       2026-06-28
Description:
    - reads the "campus_locations.txt" file located in the "src/data" directory
    - processes its contents to fix encoding issues and formatting, creating TypeScript objects for each location in string form
    - updates the TypeScript file with the cleaned and formatted location data

    The script replaces certain characters, splits the text into entries, and ensures each entry is properly formatted for readability.

General App Usage:
    - Open the 'campus_locations.xlsx' file, edit it as needed.
    - Save that file as a tab-delimited .txt file ('campus_locations.txt') in the 'src/data' directory.
    - Call the 'updateLocations' function with the path to the 'campus_locations.txt' file to:
        - process the new locations
        - update the TypeScript file with the locations

Testing through this script:
    - Update lines 21 and 24 in this script to match the names of the input and output files if they are different.
    - Run this script directly to test the functionality of the 'updateLocations' function and ensure that the TypeScript file is updated correctly with the new locations.
'''

from pathlib import Path

# The file used to read the raw location data from
input_file = "campus_locations.txt"

# The TypeScript file that will be updated with the new location data
output_file = "tester.ts"

def updateLocations(filepath, outputPath):
    # Open the file and read its contents
    f = open(filepath, "r")
    rawTXT = f.read()

    # Some characters are not properly encoded, so we need to replace them with the correct ones
    rawTXT = rawTXT.replace("â€“", "-")
    rawTXT = rawTXT.replace("\"", "")

    # Splitting each building entry by the delimiter "\n" to create a list of entries
    entries = rawTXT.split("\n")

    # Creating a new location for each entry and formatting it as a TypeScript object
    # formattedTXT will hold the final output that will be written to the TypeScript file
    formattedTXT = "export const locations: MapLocation[] = [\n"
    for entry in entries[3:]:  # Skip the first two lines which are headers or irrelevant
        entry = entry.strip()
        if entry == "":
            continue
        while entry.startswith(",") or entry.startswith("\""):
            entry = entry[1:]
        
        # Add the new location to the formatted text, using the index of the entry to assign a unique ID
        formattedTXT += createLocation(entry.split("\t"), entries.index(entry) - 2) + ",\n"
    
    # Adding the closing bracket for the TypeScript array
    formattedTXT += "];"

    # Get the directory of the project (..\\HawkMaps)
    dir = Path(__file__).resolve().parent.parent

    # Construct the path to the "campus_locations.csv" file in the "src/data" directory
    #dir = dir / "src" / "data" / outputPath

    # Update the TypeScript file with the new locations data
    updateTypescriptFile(outputPath, formattedTXT)

# Function to create a TypeScript object in string form for a location based on the provided data
def createLocation(locationData, obj_id):

    location = f"""{{
    id: {obj_id},
    name: '{locationData[0].replace("'", "\\'")}',
    latitude: {locationData[1]},
    longitude: {locationData[2]},
    type: '{locationData[5].lower()}',
    description: '{"N/A"}',
    hours: '{locationData[4].replace(".", "|")}',
    accessible: {"true"},
  }}"""

    return location

def updateTypescriptFile(filepath, newContent):
    # Open the file in write mode and read all its lines
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Replace the content of the file with the new content, keeping the first 68 lines intact
    lines = lines[:68] + ["\n" + newContent]

    # Write the updated lines back to the file
    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(lines)

# Self-testing main
if __name__ == "__main__":

    # Get the directory of the project (..\\HawkMaps)
    inputPath = Path(__file__).resolve().parent.parent
    outputPath = Path(__file__).resolve().parent.parent

    # Construct the path to the "campus_locations.txt" file in the "src/data" directory
    inputPath = inputPath / "src" / "data" / input_file

    # Construct the path to the output TypeScript file in the "src/data" directory
    outputPath = outputPath / "src" / "data" / output_file

    # Call the updateLocations function to process the file and update the TypeScript file with the new locations
    updateLocations(inputPath, outputPath)