package sportlink.sportlink.project.controladores;

import sportlink.sportlink.project.dto.SesionDto;
import sportlink.sportlink.project.servicios.ServicioSesion;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sportLink/Sesion")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ControladorSesion {
    private final ServicioSesion servicioSesion;

    public ControladorSesion(ServicioSesion servicioSesion){
        this.servicioSesion= servicioSesion;
    }

    @GetMapping("/obtenerTodos")
    public List<SesionDto> obtenerSesiones(){
        return servicioSesion.obtenerTodos();
    }

    @GetMapping("/obtener/{pkSesion}")
    public Optional<SesionDto> obtenerSesion(@PathVariable("pkSesion")int pkSesion){
        return servicioSesion.obtenerPorPk(pkSesion);
    }

    @PostMapping("/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public SesionDto crear(@RequestBody SesionDto sesionDto){
        return servicioSesion.crear(sesionDto);
    }

    @PutMapping("/actualizar")
    @ResponseStatus(HttpStatus.CREATED)
    public SesionDto actualizar(@RequestBody SesionDto sesionDto){
        return servicioSesion.actualizar(sesionDto);
    }

    @DeleteMapping("/eliminarTodos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminarTodos(){
        return servicioSesion.eliminarTodos();
    }

    @DeleteMapping("/eliminar/{pkSesion}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminar(@PathVariable("pkSesion") int pkSesion){
        return servicioSesion.eliminar(pkSesion);
    }
}
