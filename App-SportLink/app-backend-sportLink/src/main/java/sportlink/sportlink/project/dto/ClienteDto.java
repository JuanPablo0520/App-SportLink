package sportlink.sportlink.project.dto;

import sportlink.sportlink.project.entidades.Resenia;
import lombok.*;
import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteDto implements Serializable {

    private Integer idCliente;
    private String nombre;
    private String correo;
    private String contrasenia;
    private String fotoPerfil;
    private Integer fechaNacimiento;
    private Float estatura;
    private Float peso;
    private String telefono;
    private String ubicacion;
    private List<Resenia> resenias;
}
