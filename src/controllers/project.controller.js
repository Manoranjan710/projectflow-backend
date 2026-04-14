const projectService = require("../services/project.service");
const AppError = require("../utils/AppError");
const { PDFParse } = require("pdf-parse");
const { chunkText, generateEmbeddings } = require("../ai/embedding.service");
const { storeVectors } = require("../ai/vector.service");
const { askQuestion } = require("../ai/rag.service");


exports.askProjectQuestion = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { question } = req.body;

    if(!question){
      throw new AppError(400, "Question is required");
    }

    const answer = await askQuestion(projectId, question);

    res.status(200).json({
      success: true,
      data: {
        answer
      }
    });

  }catch (error) {
    next(error);
  }
};


exports.uploadDocument = async (req, res, next) => {

  try {

    const { projectId } = req.params;

    const uploadedFile =
      req.file ||
      req.files?.file?.[0] ||
      req.files?.pdf?.[0] ||
      req.files?.document?.[0];

    if (!uploadedFile) {
      throw new AppError(
        400,
        "File is required (multipart/form-data field name: file)",
      );
    }

    const isPdf =
      (uploadedFile.mimetype || "").toLowerCase().includes("pdf") ||
      (uploadedFile.originalname || "").toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      throw new AppError(400, "Only PDF files are allowed");
    }

    if (process.env.DEBUG_PDF_UPLOAD === "true") {
      console.log("[uploadDocument] file:", {
        fieldname: uploadedFile.fieldname,
        originalname: uploadedFile.originalname,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size,
      });
    }

    // 1. Extract text
    const parser = new PDFParse({ data: uploadedFile.buffer });
    let text = "";

    try {
      const pdfData = await parser.getText();
      text = pdfData?.text || "";
    } finally {
      await parser.destroy();
    }

    if (!text.trim()) {
      throw new AppError(400, "No text could be extracted from this PDF");
    }

    if (process.env.DEBUG_PDF_UPLOAD === "true") {
      console.log("[uploadDocument] text extracted:", { textLength: text.length });
    }

    // 2. Chunk text
    const chunks = chunkText(text);

    if (process.env.DEBUG_PDF_UPLOAD === "true") {
      console.log("[uploadDocument] chunked:", { chunks: chunks.length });
    }

    // // 3. Generate embeddings
    // const embeddings = [];

    // for (const chunk of chunks) {
    //   const embedding = await generateEmbedding(chunk);
    //   embeddings.push(embedding);
    // }
    const embeddings = await generateEmbeddings(chunks);
    // 4. Store in Qdrant
    if (process.env.DEBUG_PDF_UPLOAD === "true") {
      console.log("[uploadDocument] embeddings:", { vectors: embeddings.length });
    }

    await storeVectors(projectId, chunks, embeddings);

    if (process.env.DEBUG_PDF_UPLOAD === "true") {
      console.log("[uploadDocument] extracted:", {
        textLength: text.length,
        chunks: chunks.length,
      });
    }

    res.status(200).json({
      success: true,
      message: "Document processed and stored successfully",
      data: {
        chunks: chunks.length
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const result = await projectService.createProject(req.body, req.user);
    res.status(201).json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.projectId, req.user);
    res.status(200).json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (err) {
    next(err);
  } 
};

exports.getProjects = async (req, res, next) => {
  try {
    const result = await projectService.getProjects(req.query, req.user);

    res.status(200).json({
      success: true,
      data: result,
      message: "Projects fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const result = await projectService.addMember(
      req.params.projectId,
      req.body.userId,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "User added to project",
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableUsers = async (req, res, next) => {
  try {
    const users = await projectService.getAvailableUsers(
      req.params.projectId,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectMembers = async (req, res, next) => {
  try {
    const members = await projectService.getProjectMembers(
      req.params.projectId,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectDetails = async (req, res, next) => {
  try {
    const result = await projectService.getProjectDetails(
      req.params.projectId,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    await projectService.removeMember(
      req.params.projectId,
      req.params.userId,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
