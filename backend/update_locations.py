'''
Author:     Ali Rauf
Date:       2026-07-22
Description:
    - reads the "campus_locations.txt" file located in the "src/data" directory
    - processes its contents to fix encoding issues and formatting, creating TypeScript objects for each location in string form
    - creates / updates the "study_spaces.csv" file in the "src/data" directory with all the study spaces
    - updates the TypeScript file with the cleaned and formatted location data

    The script replaces certain characters, splits the text into entries, and ensures each entry is properly formatted for readability.

General App Usage:
    - Open the 'campus_locations.xlsx' file, edit it as needed.
    - Save that file as a tab-delimited .txt file ('campus_locations.txt') in the 'src/data' directory.
    - Call the 'updateLocations' function with the path to the 'campus_locations.txt' file to:
        - process the new locations
        - update the TypeScript file with the locations
        - create / update the 'study_spaces.csv' file with all the study spaces

Testing through this script:
    - Update lines 26 and 29 in this script to match the names of the input and output files if they are different.
    - Run this script directly to test:
        - functionality of the 'updateLocations' function and ensure that the TypeScript file is updated correctly with the new locations
        - functionality of the 'updateStudySpacesFile' function and ensure that the 'study_spaces.csv' file is updated correctly with the new study space data
        - functionality of the 'getStudySpaceData' function and ensure that it returns the correct data from the 'study_spaces.csv' file
'''

from pathlib import Path

# The file used to read the raw location data from
input_file = "campus_locations.txt"

# The TypeScript file that will be updated with the new location data
output_file = "locations.ts"

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
    # studySpacesTXT will hold the formatted text for the study spaces text file
    formattedTXT = "export const locations: MapLocation[] = [\n"
    studySpacesTXT = ""
    for entry in entries[3:]:  # Skip the first two lines which are headers or irrelevant
        entry = entry.strip()
        if entry == "":
            continue
        while entry.startswith(",") or entry.startswith("\""):
            entry = entry[1:]

        splitEntry = entry.split("\t")
        
        # Add the new location to the formatted text, using the index of the entry to assign a unique ID
        formattedTXT += createLocation(splitEntry, entries.index(entry) - 2) + ",\n"

        # If the entry is a study space, add it to the studySpacesTXT string
        if splitEntry[5] == "Study":
            # Name of study space, busy indicator, total number of seats, number of occupied seats (initially set to 0)
            studySpacesTXT += splitEntry[0] + ",Mostly Vacant,60,0\n"
    
    # Adding the closing bracket for the TypeScript array
    formattedTXT += "];"

    # Get the directory of the project (..\\HawkMaps)
    dir = Path(__file__).resolve().parent.parent

    # Construct the path to the "campus_locations.csv" file in the "src/data" directory
    #dir = dir / "src" / "data" / outputPath

    # Write the study spaces data to a CSV file in the "src/data" directory
    with open(dir / "src" / "data" / "study_spaces.csv", "w") as f:
        f.write(studySpacesTXT)

    # Update the TypeScript file with the new locations data
    updateTypescriptFile(outputPath, formattedTXT)

# Reads the study spaces data from the "study_spaces.csv" file and returns it as a list of lists
# Returns a list of lists, where each inner list contains the name, busy indicator, total seats, and occupied seats of a study space
def getStudySpaceData():
    output = []
    with open(Path(__file__).resolve().parent.parent / "src" / "data" / "study_spaces.csv", "r") as f:
        for line in f:
            splitLine = line.split(",")
            output.append([splitLine[0], splitLine[1], splitLine[2], splitLine[3].strip()])
    return output

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

# Function to update the TypeScript file with the new locations data, keeping the first 68 lines intact
def updateTypescriptFile(filepath, newContent):
    # Open the file in write mode and read all its lines
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Replace the content of the file with the new content, keeping the first 68 lines intact
    lines = lines[:68] + ["\n" + newContent]

    # Write the updated lines back to the file
    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(lines)

# Function to update the study spaces data in the "study_spaces.csv" file based on the provided study space name
def updateStudySpacesFile(studySpace):
    # Open the file in reading and writing mode
    with open(Path(__file__).resolve().parent.parent / "src" / "data" / "study_spaces.csv", "r") as f:
        lines = f.readlines()

    # Check if the study space is found in the file and update its occupied seats and busy indicator accordingly
    locationFound = False
    updatedLines = ""
    for space in lines:
        if studySpace in space:
            locationFound = True
            spaceData = space.split(",")
            occupiedSeats = int(spaceData[3].strip()) + 1
            percentage = occupiedSeats / int(spaceData[2])
            if percentage >= 0.66:
                busyIndicator = "Crowded"
            elif percentage >= 0.33:
                busyIndicator = "Moderate"
            else:
                busyIndicator = "Mostly Vacant"
            updatedLines += spaceData[0] + "," + busyIndicator + "," + spaceData[2] + "," + str(occupiedSeats) + "\n"
        else:
            updatedLines += space

    # If the location was not found in the file, print a message indicating that it was not found. Otherwise, write the updated lines back to the file.
    if not locationFound:
        print(f"Location {studySpace} not found.")
    else:
        with open(Path(__file__).resolve().parent.parent / "src" / "data" / "study_spaces.csv", "w") as f:
            f.write(updatedLines)

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

    # Call the getStudySpaceData function to retrieve the original study space data and print it
    print("---------------------------------------------------------------------------------------------------")
    print("Original Study Space Data")
    for space in getStudySpaceData():
        print(space)
    
    # Call the updateStudySpacesFile function to update the study spaces data for a specific location
    updateStudySpacesFile("Library")

    # Call the getStudySpaceData function to retrieve the updated study space data and print it
    print("---------------------------------------------------------------------------------------------------")
    print("Updated Study Space Data")
    for space in getStudySpaceData():
        print(space)
    print("---------------------------------------------------------------------------------------------------")