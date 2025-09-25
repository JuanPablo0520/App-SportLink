package sportlink.sportlink.project.controladores;

import sportlink.sportlink.project.dto.ClienteDto;
import sportlink.sportlink.project.servicios.ServicioCliente;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sportLink/Cliente")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ControladorCliente {

    // private final ModelMapper modelMapper = new ModelMapper();
    private final ServicioCliente servicioCliente;

    public ControladorCliente(ServicioCliente servicioCliente){
        this.servicioCliente = servicioCliente;
    }

    @GetMapping("/obtenerTodos")
    public List<ClienteDto> obtenerClientes(){
       return servicioCliente.obtenerTodos();
    }

    @GetMapping("/obtener/{pkCliente}")
    public Optional<ClienteDto> obtenerCliente(@PathVariable("pkCliente")int pkCliente){
        return servicioCliente.obtenerPorPk(pkCliente);
    }



    @PostMapping("/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteDto crear(@RequestBody ClienteDto clienteDto){
        return servicioCliente.crear(clienteDto);
    }

    @PutMapping("/actualizar")
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteDto actualizar(@RequestBody ClienteDto clienteDto){
        return servicioCliente.actualizar(clienteDto);
    }

    @DeleteMapping("/eliminarTodos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminarTodos(){
        return servicioCliente.eliminarTodos();
    }

    @DeleteMapping("/eliminar/{pkCliente}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminar(@PathVariable("pkCliente") int pkCliente){
        return servicioCliente.eliminar(pkCliente);
    }
}

