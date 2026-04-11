-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 11-04-2026 a las 05:02:16
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
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `idCategoria` int(11) NOT NULL,
  `nombreCategoria` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`idCategoria`, `nombreCategoria`, `descripcion`) VALUES
(1, 'Cigarrillos y Tabaco', 'Cigarrillos de diferentes marcas y variedades, incluyendo mentolados y comunes.'),
(2, 'Vinos', 'Vinos tintos, blancos y dulces en botellas y tetra brick.'),
(3, 'Cervezas', 'Cervezas en lata o botella, con o sin alcohol, retornables o descartables.'),
(4, 'Destilados y Aperitivos', 'Vodka, gin, whisky, ron, fernet, aperitivos como Campari y licores varios.'),
(5, 'Espumantes y Sidras', 'Bebidas espumantes como Chandon, Novecento y sidras tradicionales.'),
(6, 'Gaseosas', 'Gaseosas de diferentes sabores y presentaciones (botellas, retornables, etc.).'),
(7, 'Aguas y Saborizadas', 'Agua mineral y bebidas saborizadas como Aquarius, Levit?? o Livra.'),
(8, 'Jugos y Chocolatadas', 'Jugos en caja o botella y chocolatadas como Nesquik.'),
(9, 'Bebidas Energizantes', 'Bebidas como Speed, Rockstar y Monster.'),
(10, 'Bebidas Isot??nicas', 'Gatorade, Powerade y otras bebidas para deportistas.'),
(11, 'Snacks Salados', 'Papas fritas, palitos, nachos, chizitos, tutucas y similares.'),
(12, 'Galletitas', 'Galletitas dulces y saladas, surtidas o individuales.'),
(13, 'Golosinas y Alfajores', 'Alfajores simples o triples, gomas, caramelos y otras golosinas.'),
(14, 'Chocolates', 'Chocolates en barra, bombones y productos como Milka, Kinder o Cofler.'),
(15, 'Yerba Mate y Az??car', 'Yerbas de distintas marcas y az??car para infusiones.'),
(16, 'Cuidado Personal', 'Productos como chicles, pastillas mentoladas y preservativos.'),
(17, 'Snacks Saludables', 'Semillas, barritas de cereal y otros productos alternativos.'),
(18, 'otros', 'varios'),
(19, 'alcohol', 'bebidas alcoh??licas'),
(20, 'Sandwich', '');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`idCategoria`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `idCategoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
