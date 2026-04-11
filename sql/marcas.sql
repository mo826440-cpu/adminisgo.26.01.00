-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 11-04-2026 a las 05:03:58
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gestion_kioscos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marcas`
--

CREATE TABLE `marcas` (
  `idMarca` int(11) NOT NULL,
  `nombreMarca` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `idCategoria` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `marcas`
--

INSERT INTO `marcas` (`idMarca`, `nombreMarca`, `descripcion`, `idCategoria`) VALUES
(153, 'Marlboro', '', 1),
(154, 'Parliament', '', 1),
(155, 'Philip Morris', '', 1),
(156, 'Milenio', '', 1),
(157, 'Pier', '', 1),
(158, 'Liverpool', '', 1),
(159, 'Kiel', '', 1),
(160, 'Mil', '', 1),
(161, 'Master', '', 1),
(162, 'Red Point', '', 1),
(163, 'Golden', '', 1),
(164, 'Lucky Strike', '', 1),
(165, 'Chesterfield', '', 1),
(166, 'Chacabuco', '', 2),
(167, 'Las Perdices', '', 2),
(168, 'Perro Callejero', '', 2),
(169, 'Vi??as de Balbo', '', 2),
(170, 'Oveja Black', '', 2),
(171, 'Huelga de Amores', '', 2),
(172, 'Col??n', '', 2),
(173, 'La Iride', '', 2),
(174, 'Chanchullo', '', 2),
(175, 'Conejo Negro', '', 2),
(176, 'Sin Palabras', '', 2),
(177, 'Portillo', '', 2);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `marcas`
--
ALTER TABLE `marcas`
  ADD PRIMARY KEY (`idMarca`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `marcas`
--
ALTER TABLE `marcas`
  MODIFY `idMarca` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=292;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
